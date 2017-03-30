import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as pify from 'pify';

type StdoutLogger = (message: string) => void;

interface IArgvObject {
    [argName: string]: string|string[];
}

const noop = () => {}; // tslint:disable-line:no-empty

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
    cAssetBundleTarget: string,
    signalAssetProcessed: (assetPath: string) => void = noop
) {
    await runUnityProcess({
        projectPath: directory,
        executeMethod: 'AssetBundleCompiler.Convert',
        cTempAssetsDirectory, cAssetNames, cAssetBundleDirectory, cAssetBundleName, cAssetBundleTarget
    }, (message) => {
        const matches = message.match(/^Updating Assets\/CopiedAssets-[0-9]+\/(.+?)(?= - GUID)/);
        if (matches !== null) {
            signalAssetProcessed(matches[1]);
        }
    });
}

async function runUnityProcess(
    options: IArgvObject,
    logger: StdoutLogger = noop
): Promise<void> {
    //=> Check Unity executable existence
    try {
        await pify(fs.access)(unityBinaryPath, fs.constants.X_OK);
    } catch (err) {
        throw new Error(`Unable to execute Unity, make sure ${unityBinaryPath} exists and is executable.`);
    }

    //=> Merge arguments with default arguments
    options = {
        quit: null, batchmode: null,
        logFile: null, // this makes Unity log to stdout, of course
        ...options
    };

    //=> Generating an argv array from the arguments object
    const argv = toArgv(options);

    //=> Spawn unity process
    const unityProcess = spawn(unityBinaryPath, argv);

    //=> Watch process' stdout to log in real time, and keep the complete output in case of crash
    let stdoutAggregator = '';
    function stdoutHandler(buffer: Buffer) {
        const message = buffer.toString();
        stdoutAggregator += message;
        logger(message.trim());
    }

    unityProcess.stdout.on('data', stdoutHandler);
    unityProcess.stderr.on('data', stdoutHandler);

    //=> Watch for the process to terminate, check return code
    return new Promise<void>((resolve, reject) => {
        unityProcess.once('close', async (close) => {
            if (close === 0) {
                resolve();
            } else {
                const crashPath = await logUnityCrash(stdoutAggregator);
                // tslint:disable-next-line:max-line-length
                reject(new UnityCrashError(`Unity process crashed! Editor log has been written to ${crashPath}`, stdoutAggregator));
            }
        });
    });
}

function toArgv(options: IArgvObject): string[] {
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

    return argv;
}

async function logUnityCrash(unityLog: string): Promise<string> {
    const crashPath = path.join(os.tmpdir(), 'unity_crash.abcompiler.log');

    await pify(fs.writeFile)(crashPath, unityLog);

    return crashPath;
}

export class UnityCrashError extends Error {
    constructor(message: string, public readonly unityLog: string) {
        super(message);
        Object.setPrototypeOf(this, UnityCrashError.prototype);
    }
}
