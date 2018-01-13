import { logger } from '@mitm/unityinvoker';
import * as fs from 'fs-extra';
import * as path from 'path';
import { BuildContext } from './build_context';
import * as streamMaker from './stream_maker';
import * as unityproj from './unity_project';

enum BundlerState { Configuring, Bundling, Dead }

export interface IBuildOptionsMap {
    /** Allows custom build options (ie. Unity adds enum members and the lib is not in sync) */
    [enumMemberName: string]: boolean | undefined;
    /** Build assetBundle without any special option. */
    none?: boolean;
    /** Don't compress the data when creating the asset bundle. */
    uncompressedAssetBundle?: boolean;
    /** Do not include type information within the AssetBundle. */
    disableWriteTypeTree?: boolean;
    /** Builds an asset bundle using a hash for the id of the object stored in the asset bundle. */
    deterministicAssetBundle?: boolean;
    /** Force rebuild the assetBundles. */
    forceRebuildAssetBundle?: boolean;
    /** Ignore the type tree changes when doing the incremental build check. */
    ignoreTypeTreeChanges?: boolean;
    /** Append the hash to the assetBundle name. */
    appendHashToAssetBundleName?: boolean;
    /** Use chunk-based LZ4 compression when creating the AssetBundle. */
    chunkBasedCompression?: boolean;
    /** Do not allow the build to succeed if any errors are reporting during it. */
    strictMode?: boolean;
    /** Do a dry run build. */
    dryRunBuild?: boolean;
    /** Disables Asset Bundle LoadAsset by file name. */
    disableLoadAssetByFileName?: boolean;
    /** Disables Asset Bundle LoadAsset by file name with extension. */
    disableLoadAssetByFileNameWithExtension?: boolean;
}

export class AssetsBundler {
    private logger: logger.SimpleLogger = logger.noopLogger;
    private unityLogger: logger.SimpleLogger = logger.noopLogger;
    private editorScriptsStreams: fs.ReadStream[] = [];
    private assetsStreams: fs.ReadStream[] = [];
    private buildOptions = new Set<string>();
    private buildTarget: unityproj.BuildTarget;
    private state = BundlerState.Configuring;

    public includingAssets(...assets: streamMaker.ReadableFileInput[]): this {
        this.checkBundlerIsntAlreadyConfigured();

        assets.map(streamMaker.normalizeReadStream).forEach(stream => this.assetsStreams.push(stream));

        return this;
    }

    public targeting(buildTarget: unityproj.BuildTarget): this {
        this.checkBundlerIsntAlreadyConfigured();

        if (typeof buildTarget !== 'string') {
            throw new Error('buildTarget must be a string (member name of an UnityEngine.BuildTarget enum).');
        }

        this.buildTarget = buildTarget;

        return this;
    }

    public withLogger(loggerFn: logger.SimpleLogger): this {
        this.checkBundlerIsntAlreadyConfigured();
        this.checkLoggerType(loggerFn);

        this.logger = loggerFn;

        return this;
    }

    public withUnityLogger(unityLogger: logger.SimpleLogger): this {
        this.checkBundlerIsntAlreadyConfigured();
        this.checkLoggerType(unityLogger);

        this.unityLogger = unityLogger;

        return this;
    }

    public withBuildOptions(buildOptions: IBuildOptionsMap): this {
        this.checkBundlerIsntAlreadyConfigured();

        Object.keys(buildOptions)
            .filter(key => buildOptions[key])
            .forEach(key => this.buildOptions.add(key));

        return this;
    }

    public includingEditorScripts(...scripts: streamMaker.ReadableFileInput[]): this {
        this.checkBundlerIsntAlreadyConfigured();

        scripts.map(streamMaker.normalizeReadStream).forEach(stream => this.editorScriptsStreams.push(stream));

        return this;
    }

    public async to(
        file: streamMaker.WritableFileInput,
        { overwrite }: { overwrite: boolean } = { overwrite: true }
    ): Promise<void> {
        if (!this.buildTarget) {
            throw new Error('You must set a build target by calling targeting() before calling to().');
        }

        this.state = BundlerState.Bundling;

        //=> Normalize dest to a writable strem
        const fileStream = streamMaker.normalizeWriteStream(file);
        const fileName = path.basename(fileStream.path.toString());

        //=> Create the build context (contains infos about the paths used by the current build)
        const buildContext = new BuildContext(fileName);

        //=> Handle abrupt process terminations
        const signalCleanup = this.signalCleanup.bind(this, buildContext);
        process.on('SIGINT', signalCleanup);
        process.on('SIGTERM', signalCleanup);

        try {
            //=> Create project and temporary "sub project"
            //---------------------------------------------
            this.logger(`Preparing Unity project in ${buildContext.projectRootDir}`);

            await unityproj.cleanupProject(buildContext);
            await unityproj.warmupProject(buildContext);

            //=> Copy original assets and scripts into the project (Unity limitation)
            //-----------------------------------------------------------------------
            this.logger(`Copying assets to ${buildContext.assetsDir}`);
            await unityproj.copyAssetsInProject(buildContext, this.assetsStreams);

            this.logger(`Copying custom editor scripts to ${buildContext.editorScriptsDir}`);
            await unityproj.copyEditorScriptsInProject(buildContext, this.editorScriptsStreams);

            //=> Generate the asset bundle
            //----------------------------
            this.logger(`Generating asset bundle in ${buildContext.assetBundleDir}`);

            await unityproj.generateAssetBundle(
                buildContext,
                this.assetsStreams,
                this.buildOptions,
                this.buildTarget,
                this.unityLogger,
                assetPath => this.logger(`Updating resource: ${assetPath}`)
            );

            //=> Move the generated asset bundle to the final dest
            //----------------------------------------------------
            this.logger(`Moving asset bundle to target destination`);
            await unityproj.moveGeneratedAssetBundle(buildContext, fileStream, overwrite);
        } finally {
            //=> Success or error doesn't matter, we have to cleanup!
            //-------------------------------------------------------
            process.removeListener('SIGINT', signalCleanup);
            process.removeListener('SIGTERM', signalCleanup);

            await this.cleanup(buildContext);
        }

        //=> OK.
        //------
        this.state = BundlerState.Dead;
        this.logger('Done.');
    }

    private async cleanup(context: BuildContext): Promise<void> {
        this.logger('Cleaning up the Unity project');
        await unityproj.cleanupProject(context);
    }

    private async signalCleanup(context: BuildContext): Promise<void> {
        await this.logger('AssetBundle conversion cancelled by user!');
        await this.cleanup(context);
        process.exit(0);
    }

    private checkLoggerType(loggerFn: logger.SimpleLogger): void {
        if (typeof loggerFn !== 'function') {
            throw new Error('Logger must be a function of type (message?: string) => void.');
        }
    }

    private checkBundlerIsntAlreadyConfigured(): void {
        if (this.state !== BundlerState.Configuring) {
            throw new Error('Cannot configure the bundler after the AssetBundle build has started!');
        }
    }
}
