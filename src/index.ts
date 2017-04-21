import { AssetsBundler } from './assets_bundler';
import * as BuildTargets from './build_targets';
import { ReadableFileInput } from './stream_maker';

export { setUnityPath, UnityCrashError } from '@mitm/unityinvoker';
export * from './assets_bundler';
export { BuildTargets };

export function bundle(...assets: ReadableFileInput[]): AssetsBundler {
    return new AssetsBundler().includingAssets(...assets);
}
