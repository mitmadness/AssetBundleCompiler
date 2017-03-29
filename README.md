# AssetBundleCompiler

Node.js wrapper around Unity3D's BuildPipeline to create AssetBundles from any files

## Future scope

 - Stop relying on `fs.ReadStream` and `fs.WriteStream` on the public API, and use normal streams.
 - Implement a StreamWriter interface?
 - Implement a vinyl/Gulp-compatible interface?
 - Generate multiple asset bundles at the time, spawning only one Unity process.
 - When generating multiple ABs, handle multiple temporary projects to exploit multi-cores CPUs better.
 - CLI interface
 - Web interface
