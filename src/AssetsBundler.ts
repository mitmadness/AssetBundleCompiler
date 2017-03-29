import * as fs from 'fs-extra';
import { BuildContext } from './BuildContext';
import * as streamMaker from './stream_maker';
import * as unityproj from './unity_project';

export class AssetsBundler {
    private fileStreams: fs.ReadStream[] = [];
    private buildTarget: unityproj.BuildTarget;
    private finalDest: string|fs.WriteStream;

    public add(file: streamMaker.ReadableFileInput): this {
        const fileStream = streamMaker.normalizeReadStream(file);

        this.fileStreams.push(fileStream);

        return this;
    }

    public for(buildTarget: unityproj.BuildTarget): this {
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

        this.finalDest = file;

        const buildContext = new BuildContext();

        await unityproj.warmupProject(buildContext);
        await unityproj.copyAssetsToProject(buildContext, this.fileStreams);
        await unityproj.generateAssetBundle(buildContext, this.fileStreams, this.buildTarget);
        await unityproj.moveGeneratedAssetBundle(buildContext, this.finalDest, overwrite);
        await unityproj.cleanupProject(buildContext);
    }
}
