import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as pify from 'pify';
import * as streamify from './stream_maker';
import * as unity from './unity_invoker';

const ProjectDirectory = path.join(os.tmpdir(), 'AssetBundleCompiler');
const CompilerScriptSource = path.resolve(`${__dirname}/../resources/AssetBundleCompiler.cs`);
const CompilerScriptDest = path.resolve(`${ProjectDirectory}/Assets/Editor/AssetBundleCompiler.cs`);

export type BuildTarget =
    'BB10'|'MetroPlayer'|'iPhone'|'StandaloneOSXUniversal'|'StandaloneOSXIntel'|'StandaloneWindows'|'WebPlayer'|
    'WebPlayerStreamed'|'iOS'|'PS3'|'XBOX360'|'Android'|'StandaloneLinux'|'StandaloneWindows64'|'WebGL'|'WSAPlayer'|
    'StandaloneLinux64'|'StandaloneLinuxUniversal'|'WP8Player'|'StandaloneOSXIntel64'|'BlackBerry'|'Tizen'|'PSP2'|
    'PS4'|'PSM'|'XboxOne'|'SamsungTV'|'N3DS'|'WiiU'|'tvOS'|'Switch';

export class AssetsBundler {
    private fileStreams: fs.ReadStream[] = [];
    private ctorTimestamp = new Date().getTime();
    private tempAssetsDirName = `CopiedAssets-${this.ctorTimestamp}`;
    private tempAssetsDir = path.resolve(`${ProjectDirectory}/Assets/${this.tempAssetsDirName}`);
    private tempAssetBundleDir = path.resolve(`${ProjectDirectory}/GeneratedAssetBundles-${this.ctorTimestamp}`);
    private buildTarget: BuildTarget;
    private finalDest: string|fs.WriteStream;

    public add(file: streamify.ReadableFileInput): this {
        const fileStream = streamify.normalizeReadStream(file);

        this.fileStreams.push(fileStream);

        return this;
    }

    public for(buildTarget: BuildTarget): this {
        this.buildTarget = buildTarget;

        return this;
    }

    public async to(file: streamify.WritableFileInput): Promise<void> {
        if (!this.buildTarget) {
            throw new Error('You must set a build target by calling for() before calling to().');
        }

        this.finalDest = file;

        await this.warmupUnityProject();
        await this.copyAssetsToUnityProject();
        await this.generateAssetBundle();
        await this.moveGeneratedAssetBundle();
        await this.cleanupUnityProject();
    }

    private async warmupUnityProject(): Promise<void> {
        if (await this.shouldCreateUnityProject()) {
            await unity.createProject(ProjectDirectory);
            await this.copyEditorScriptToUnityProject();
        }

        const mkdir = pify(fs.mkdir);
        await mkdir(this.tempAssetsDir);
        await mkdir(this.tempAssetBundleDir);
    }

    private async shouldCreateUnityProject(): Promise<boolean> {
        try {
            await pify(fs.access)(ProjectDirectory, fs.constants.R_OK | fs.constants.W_OK);
            return false;
        } catch (err) {
            return true;
        }
    }

    private async copyEditorScriptToUnityProject(): Promise<void> {
        await pify(fs.mkdirp)(path.dirname(CompilerScriptDest));
        await pify(fs.copy)(CompilerScriptSource, CompilerScriptDest);
    }

    private async copyAssetsToUnityProject(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let streamsLeft = this.fileStreams.length;

            for (const assetSource of this.fileStreams) {
                const fileName = path.basename(assetSource.path as string);
                const assetDest = fs.createWriteStream(path.join(this.tempAssetsDir, fileName));

                assetSource.pipe(assetDest);

                assetDest.on('finish', () => --streamsLeft || resolve());
                assetDest.on('error', (err: Error) => reject(err));
            }
        });
    }

    private async generateAssetBundle(): Promise<void> {
        const assetNames = this.fileStreams.map(fileStream => path.basename(fileStream.path as string));

        await unity.generateAssetBundle(
            ProjectDirectory,
            this.tempAssetsDirName,
            assetNames,
            this.tempAssetBundleDir,
            'assetbundle',
            this.buildTarget
        );
    }

    private async moveGeneratedAssetBundle(): Promise<void> {
        const assetBundlePath = path.resolve(`${this.tempAssetBundleDir}/assetbundle`);

        if (typeof this.finalDest === 'string') {
            await pify(fs.move)(assetBundlePath, this.finalDest);
        } else if (streamify.isWriteStream(this.finalDest)) {
            const assetBundleStream = fs.createReadStream(assetBundlePath);

            return new Promise<void>((resolve, reject) => {
                assetBundleStream.pipe(this.finalDest as fs.WriteStream)
                    .on('finish', () => resolve())
                    .on('error', (err: Error) => reject(err));
            });
        }
    }

    private async cleanupUnityProject(): Promise<void> {
        const rmrf = pify(fs.remove);

        await rmrf(this.tempAssetsDir);
        await rmrf(this.tempAssetsDir + '.meta');
        await rmrf(this.tempAssetBundleDir);
    }
}
