import { AssetsBundler } from './assets_bundler';
import * as BuildTargets from './build_targets';
import { ReadableFileInput } from './stream_maker';

export * from './assets_bundler';
export { setUnityPath } from './unity_finder';
export { UnityCrashError } from './unity_invoker';
export { BuildTargets };

export function bundle(...assets: ReadableFileInput[]): AssetsBundler {
    return new AssetsBundler().includingAssets(...assets);
}
