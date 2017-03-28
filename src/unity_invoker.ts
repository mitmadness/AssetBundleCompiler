import { spawn } from 'child_process';

const UnityBinaryPath = '/opt/Unity/Editor/Unity';

export async function createProject(directory: string): Promise<void> {
    await runUnityProcess({ createProject: directory });
}

export async function generateAssetBundle(
    directory: string,
    cTempAssetsDirectory: string,
    cAssetNames: string[],
    cAssetBundleDirectory: string,
    cAssetBundleName: string,
    cAssetBundleTarget: string
) {
    await runUnityProcess({
        projectPath: directory,
        executeMethod: 'AssetBundleCompiler.Convert',
        cTempAssetsDirectory, cAssetNames, cAssetBundleDirectory, cAssetBundleName, cAssetBundleTarget
    });
}

export function runUnityProcess(
    options: { [argName: string]: string|string[] }
): Promise<void> {
    options = {
        quit: null, batchmode: null,
        ...options
    };

    const argv: string[] = [];

    Object.keys(options).forEach((option) => {
        argv.push('-' + option);

        if (Array.isArray(options[option])) {
            const values = options[option] as string[];
            values.forEach(value => argv.push(value));
        } else if (options[option] !== null) {
            argv.push(options[option] as string);
        }
    });

    const unityProcess = spawn(UnityBinaryPath, argv);

    return new Promise<void>((resolve, reject) => {
        unityProcess.once('close', close => close === 0
            ? resolve()
            : reject(new Error('Unity process crashed, please check Editor.log.'))
        );
    });
}
