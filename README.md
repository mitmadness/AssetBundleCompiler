<img src="https://github.com/mitmadness/AssetBundleCompiler/raw/master/abcompiler-logo.png" alt="AssetBundleCompiler logo" align="right">

# [AssetBundle](https://docs.unity3d.com/Manual/AssetBundlesIntro.html)Compiler

Node.js wrapper around Unity3D's BuildPipeline to create AssetBundles programmatically from any files, in order to simplify and automatize your workflow.

From the [documentation](https://docs.unity3d.com/Manual/AssetBundlesIntro.html):

> AssetBundles are files which you can export from Unity to contain Assets of your choice, [that] can be loaded on demand by your application. This allows you to stream content, such as models, Textures, audio clips, or even entire Scenes [...].

----------------

Working with Unity's CLI and generating asset bundles gives headaches. If you are integrating asset bundle generation in a Node.js server or want a simple tool to do it, AssetBundleCompiler may satisfy you:

```typescript
await bundle(...assets).for(WebGL).to('/path/to/asset.bundle');
```

## Installation & Usage

// To do

## API

// To do

## Future scope

 - Stop relying on `fs.ReadStream` and `fs.WriteStream` on the public API, and use normal streams.
 - Implement a StreamWriter interface?
 - Implement a vinyl/Gulp-compatible interface?
 - Generate multiple asset bundles at the time, spawning only one Unity process.
 - When generating multiple ABs, handle multiple temporary projects to exploit multi-cores CPUs better.
 - CLI interface
 - Web interface
 - Catch process termination signals to cleanup the temporary project
