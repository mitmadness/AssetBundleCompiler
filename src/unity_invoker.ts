import { invokeHeadlessUnity, logger } from '@mitm/unityinvoker';

export async function createProject(directory: string): Promise<void> {
    await invokeHeadlessUnity().createProject(directory).run();
}

export async function generateAssetBundle(
    directory: string,
    cAssetNames: string[],
    cAssetBundleDirectory: string,
    cAssetBundleName: string,
    cAssetBundleBuildOptions: Set<string>,
    cAssetBundleTarget: string,
    unityLogger: logger.SimpleLogger = logger.noopLogger,
    signalAssetProcessed: logger.SimpleLogger = logger.noopLogger
) {
    const scriptOptions = {
        cAssetNames, cAssetBundleDirectory, cAssetBundleName,
        cAssetBundleBuildOptions: Array.from(cAssetBundleBuildOptions),
        cAssetBundleTarget
    };

    let compilerError: Error | null = null;

    function handleLogLine(message: string): void {
        unityLogger(message);

        const updatingAsset = getUpdatingAsset(message);
        const unrecogAsset = getUnrecognizedAsset(message);

        if (updatingAsset) {
            signalAssetProcessed(updatingAsset);
        } else if (unrecogAsset) {
            compilerError = new Error(`File "${unrecogAsset}" is not processable by Unity, this is not a valid asset.`);
        }
    }

    await invokeHeadlessUnity()
        .projectPath(directory)
        .executeMethod('AssetBundleCompiler.Convert')
        .withOptions(scriptOptions)
        .run(handleLogLine);

    //=> For now we rethrow the last encountered error, sometimes long after it has been encoutered.
    //   @todo make it better.
    if (compilerError) {
        throw compilerError;
    }
}

function getUpdatingAsset(message: string): string | null {
    const updateMessage = /^Updating Assets\/CopiedAssets\/(.+?)(?= - GUID)/;
    const matches = message.match(updateMessage);

    return matches !== null ? matches[1] : null;
}

function getUnrecognizedAsset(message: string): string | null {
    const unrecogMessage = /^Unrecognized assets cannot be included in AssetBundles?: "Assets\/CopiedAssets\/(.+?)"/;
    const matches = message.match(unrecogMessage);

    return matches !== null ? matches[1] : null;
}
