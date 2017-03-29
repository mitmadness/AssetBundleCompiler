import * as path from 'path';
import { ProjectDirectory } from './unity_project';

export class BuildContext {
    public readonly assetsDirName: string;
    public readonly assetsDir: string;
    public readonly assetBundleDir: string;

    private ctorTimestamp = new Date().getTime();

    public constructor() {
        this.assetsDirName  = `CopiedAssets-${this.ctorTimestamp}`;
        this.assetsDir      = path.resolve(`${ProjectDirectory}/Assets/${this.assetsDirName}`);
        this.assetBundleDir = path.resolve(`${ProjectDirectory}/GeneratedAssetBundles-${this.ctorTimestamp}`);
    }
}
