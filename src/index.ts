import { AssetsBundler } from './AssetsBundler';
import * as BuildTargets from './build_targets';
import { ReadableFileInput } from './stream_maker';

export * from './AssetsBundler';
export { setUnityPath } from './unity_finder';
export { BuildTargets };

export function bundle(...files: ReadableFileInput[]): AssetsBundler {
    const bundler = new AssetsBundler();

    for (const file of files) {
        bundler.include(file);
    }

    return bundler;
}
