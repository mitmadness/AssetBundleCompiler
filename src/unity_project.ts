import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as pify from 'pify';
import { BuildContext } from './BuildContext';
import * as streamMaker from './stream_maker';
import * as unity from './unity_invoker';

export type BuildTarget =
    'BB10'|'MetroPlayer'|'iPhone'|'StandaloneOSXUniversal'|'StandaloneOSXIntel'|'StandaloneWindows'|'WebPlayer'|
    'WebPlayerStreamed'|'iOS'|'PS3'|'XBOX360'|'Android'|'StandaloneLinux'|'StandaloneWindows64'|'WebGL'|'WSAPlayer'|
    'StandaloneLinux64'|'StandaloneLinuxUniversal'|'WP8Player'|'StandaloneOSXIntel64'|'BlackBerry'|'Tizen'|'PSP2'|
    'PS4'|'PSM'|'XboxOne'|'SamsungTV'|'N3DS'|'WiiU'|'tvOS'|'Switch';

export const ProjectDirectory = path.join(os.tmpdir(), 'AssetBundleCompiler');
const CompilerScriptSource = path.resolve(`${__dirname}/../resources/AssetBundleCompiler.cs`);
const CompilerScriptDest = path.resolve(`${ProjectDirectory}/Assets/Editor/AssetBundleCompiler.cs`);

export async function shouldCreateProject(): Promise<boolean> {
    try {
        await pify(fs.access)(ProjectDirectory, fs.constants.R_OK | fs.constants.W_OK);
        return false;
    } catch (err) {
        return true;
    }
}

export async function copyEditorScript(): Promise<void> {
    await pify(fs.mkdirp)(path.dirname(CompilerScriptDest));
    await pify(fs.copy)(CompilerScriptSource, CompilerScriptDest);
}

export async function warmupProject(context: BuildContext): Promise<void> {
    if (await shouldCreateProject()) {
        await unity.createProject(ProjectDirectory);
        await copyEditorScript();
    }

    const mkdir = pify(fs.mkdir);
    await mkdir(context.assetsDir);
    await mkdir(context.assetBundleDir);
}

export async function copyAssetsToProject(context: BuildContext, fileStreams: fs.ReadStream[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        let streamsLeft = fileStreams.length;

        for (const assetSource of fileStreams) {
            const fileName = path.basename(assetSource.path as string);
            const assetDest = fs.createWriteStream(path.join(context.assetsDir, fileName));

            assetSource.pipe(assetDest);

            assetDest.on('finish', () => --streamsLeft || resolve());
            assetDest.on('error', (err: Error) => reject(err));
        }
    });
}

export async function generateAssetBundle(
    context: BuildContext,
    fileStreams: fs.ReadStream[],
    buildTarget: BuildTarget,
    signalAssetProcessed?: (assetPath: string) => void
): Promise<void> {
    const assetNames = fileStreams.map(fileStream => path.basename(fileStream.path as string));

    await unity.generateAssetBundle(
        ProjectDirectory,
        context.assetsDirName,
        assetNames,
        context.assetBundleDir,
        'assetbundle',
        buildTarget,
        signalAssetProcessed
    );
}

export async function moveGeneratedAssetBundle(
    context: BuildContext,
    finalDest: string|fs.WriteStream,
    overwrite: boolean
): Promise<void> {
    const assetBundlePath = path.resolve(`${context.assetBundleDir}/assetbundle`);

    if (typeof finalDest === 'string') {
        await pify(fs.move)(assetBundlePath, finalDest, { overwrite });
    } else if (streamMaker.isWriteStream(finalDest)) {
        if (!overwrite) {
            try {
                await pify(fs.access)(finalDest.path);
                throw new Error(`File ${finalDest.path} already exists, overwrite option is false, aborting.`);
            } finally { /* pass */ }
        }

        const assetBundleStream = fs.createReadStream(assetBundlePath);

        return new Promise<void>((resolve, reject) => {
            assetBundleStream.pipe(finalDest as fs.WriteStream)
                .on('finish', () => resolve())
                .on('error', (err: Error) => reject(err));
        });
    }
}

export async function cleanupProject(context: BuildContext): Promise<void> {
    const rmrf = pify(fs.remove);

    await rmrf(context.assetsDir);
    await rmrf(context.assetsDir + '.meta');
    await rmrf(context.assetBundleDir);
}
