import * as fs from 'fs-extra';
import { BuildContext } from './BuildContext';
import * as streamMaker from './stream_maker';
import * as unityproj from './unity_project';

enum BundlerState { Configuring, Bundling, Dead }

export type Logger = (message: string) => void;

export class AssetsBundler {
    private fileStreams: fs.ReadStream[] = [];
    private buildTarget: unityproj.BuildTarget;
    private finalDest: string|fs.WriteStream;
    private state = BundlerState.Configuring;

    public include(file: streamMaker.ReadableFileInput): this {
        this.checkBundlerIsntConfigured();

        const fileStream = streamMaker.normalizeReadStream(file);
        this.fileStreams.push(fileStream);

        return this;
    }

    public for(buildTarget: unityproj.BuildTarget): this {
        this.checkBundlerIsntConfigured();

        this.buildTarget = buildTarget;

        return this;
    }

    public loggingWith(loggerFunction: Logger): this {
        this.checkBundlerIsntConfigured();

        this.logger = loggerFunction;

        return this;
    }

    public async to(
        file: streamMaker.WritableFileInput,
        { overwrite }: { overwrite: boolean } = { overwrite: true }
    ): Promise<void> {
        if (!this.buildTarget) {
            throw new Error('You must set a build target by calling for() before calling to().');
        }

        this.state = BundlerState.Bundling;
        this.finalDest = file;

        const buildContext = new BuildContext();

        //=> Create project and temporary "sub project"
        //---------------------------------------------
        this.logger('Warmuping Unity project...');
        await unityproj.warmupProject(buildContext);

        //=> Copy original assets into the project (Unity limitation)
        //-----------------------------------------------------------
        this.logger('Copying assets...');
        await unityproj.copyAssetsToProject(buildContext, this.fileStreams);

        //=> Generate the asset bundle, then move it to the right place
        //-------------------------------------------------------------
        this.logger('Generating asset bundle...');
        const logAssetImported = (asset: string) => this.logger(`Updating resource: ${asset}`);

        await unityproj.generateAssetBundle(buildContext, this.fileStreams, this.buildTarget, logAssetImported);
        await unityproj.moveGeneratedAssetBundle(buildContext, this.finalDest, overwrite);

        //=> Clean temporary "sub project" folders
        //----------------------------------------
        this.logger('Cleaning up the Unity project...');
        await unityproj.cleanupProject(buildContext);

        //=> OK.
        //------
        this.state = BundlerState.Dead;
        this.logger('Done.');
    }

    private logger(message: string): void {
        // Do nothing by default.
        // The API consumer replaces this method.
    }

    private checkBundlerIsntConfigured(): void {
        if (this.state !== BundlerState.Configuring) {
            throw new Error('Cannot configure the bundler after conversion!');
        }
    }
}
