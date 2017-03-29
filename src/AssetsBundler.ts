import * as fs from 'fs-extra';
import { BuildContext } from './BuildContext';
import * as streamMaker from './stream_maker';
import * as unityproj from './unity_project';

enum BundlerState { Configuring, Bundling, Dead }

export class AssetsBundler {
    private fileStreams: fs.ReadStream[] = [];
    private buildTarget: unityproj.BuildTarget;
    private finalDest: string|fs.WriteStream;
    private state = BundlerState.Configuring;

    public include(file: streamMaker.ReadableFileInput): this {
        this.checkBundlerIsntConfigured();

        const fileStream = streamMaker.normalizeReadStream(file)
        this.fileStreams.push(fileStream);

        return this;
    }

    public for(buildTarget: unityproj.BuildTarget): this {
        this.checkBundlerIsntConfigured();

        this.buildTarget = buildTarget;

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

        await unityproj.warmupProject(buildContext);
        await unityproj.copyAssetsToProject(buildContext, this.fileStreams);
        await unityproj.generateAssetBundle(buildContext, this.fileStreams, this.buildTarget);
        await unityproj.moveGeneratedAssetBundle(buildContext, this.finalDest, overwrite);
        await unityproj.cleanupProject(buildContext);

        this.state = BundlerState.Dead;
    }

    private checkBundlerIsntConfigured(): void {
        if (this.state !== BundlerState.Configuring) {
            throw new Error('Cannot configure the bundler after conversion!');
        }
    }
}
