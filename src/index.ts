import { AssetsBundler } from './AssetsBundler';
import { ReadableFileInput } from './stream_maker';

export * from './AssetsBundler';
export * from './build_targets';
export { setUnityPath } from './unity_invoker';

export function bundle(...files: ReadableFileInput[]): AssetsBundler {
    const bundler = new AssetsBundler();

    for (const file of files) {
        bundler.include(file);
    }

    return bundler;
}
