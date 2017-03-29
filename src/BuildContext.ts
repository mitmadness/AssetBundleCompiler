import * as path from 'path';
import { ProjectDirectory } from './unity_project';

export class BuildContext {
    public assetsDirName: string;
    public assetsDir: string;
    public assetBundleDir: string;

    private ctorTimestamp = new Date().getTime();

    public constructor() {
        this.assetsDirName = `CopiedAssets-${this.ctorTimestamp}`;
        this.assetsDir = path.resolve(`${ProjectDirectory}/Assets/${this.assetsDirName}`);
        this.assetBundleDir = path.resolve(`${ProjectDirectory}/GeneratedAssetBundles-${this.ctorTimestamp}`);
    }
}
