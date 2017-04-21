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
    await invokeHeadlessUnity()
        .projectPath(directory)
        .executeMethod('AssetBundleCompiler.Convert')
        .withOptions({
            cAssetNames, cAssetBundleDirectory, cAssetBundleName,
            cAssetBundleBuildOptions: Array.from(cAssetBundleBuildOptions),
            cAssetBundleTarget
        })
        .run((message) => {
            unityLogger(message);

            const matches = message.match(/^Updating Assets\/CopiedAssets\/(.+?)(?= - GUID)/);
            if (matches !== null) {
                signalAssetProcessed(matches[1]);
            }
        });
}
