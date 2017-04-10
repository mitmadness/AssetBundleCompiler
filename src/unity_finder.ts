import * as fs from 'fs-extra';
import * as pify from 'pify';

const candidateUnityPaths = [
    '/opt/Unity/Editor/Unity', // Debian / Ubuntu
    '/Applications/Unity/Unity.app/Contents/MacOS/Unity', // MacOS
    'C:\\Program Files (x86)\\Unity\\Editor\\Unity.exe', // Windows x86
    'C:\\Program Files\\Unity\\Editor\\Unity.exe' // Windows x64
];

let unityBinaryPath: string;

export async function getUnityPath(): Promise<string> {
    // this is not a pure function and it caches its result
    if (unityBinaryPath) { return unityBinaryPath; }

    //=> Try all paths, take the first
    for (const path of candidateUnityPaths) {
        try {
            await pify(fs.access)(path, fs.constants.X_OK);
            return unityBinaryPath = path;
        } catch (err) { /* pass */ }
    }

    //=> Oops, no Unity installation found
    const triedPaths = candidateUnityPaths.map(path => `"${path}"`).join(', ');

    throw new Error(
        `Unable to locate Unity installation, tried all of these paths: ${triedPaths}. ` +
        `Please use setUnityPath('/path/to/unity/executable').`
    );
}

export function setUnityPath(executablePath: string): void {
    unityBinaryPath = executablePath;
}
