import { spawn } from 'child_process';
import * as fs from 'fs';
import * as pify from 'pify';

export let unityBinaryPath = '/opt/Unity/Editor/Unity';

export function setUnityPath(executablePath: string): void {
    unityBinaryPath = executablePath;
}

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

export async function runUnityProcess(options: { [argName: string]: string|string[] }): Promise<void> {
    //=> Merge arguments with default arguments
    options = {
        quit: null, batchmode: null,
        logFile: null, // this makes Unity log to stdout, of course
        ...options
    };

    //=> Generating an argv array from the arguments object
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

    //=> Check Unity executable existence
    try {
        await pify(fs.access)(unityBinaryPath, fs.constants.X_OK);
    } catch (err) {
        throw new Error(`Unable to execute Unity, make sure ${unityBinaryPath} exists and is executable.`);
    }

    //=> Spawn unity process
    const unityProcess = spawn(unityBinaryPath, argv);

    //=> Watch for the process to terminate, check return code
    return new Promise<void>((resolve, reject) => {
        unityProcess.once('close', close => close === 0
            ? resolve()
            : reject(new Error('Unity process crashed, please check Editor.log.'))
        );
    });
}
