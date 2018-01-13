import * as path from 'path';
import { ProjectDirectory } from './unity_project';

export class BuildContext {
    public readonly projectRootDir: string;
    public readonly assetsDir: string;
    public readonly editorScriptsDir: string;
    public readonly assetBundleDir: string;
    public readonly assetBundlePath: string;
    public readonly assetBundleManifestPath: string;

    public constructor(public readonly assetBundleName: string) {
        this.projectRootDir = ProjectDirectory;
        this.assetsDir = path.resolve(`${ProjectDirectory}/Assets/CopiedAssets`);
        this.editorScriptsDir = path.resolve(`${ProjectDirectory}/Assets/Editor/CopiedScripts`);
        this.assetBundleDir = path.resolve(`${ProjectDirectory}/GeneratedAssetBundles`);
        this.assetBundlePath = path.resolve(`${this.assetBundleDir}/${assetBundleName}`);
        this.assetBundleManifestPath = path.resolve(`${this.assetBundlePath}.manifest`);
    }
}
