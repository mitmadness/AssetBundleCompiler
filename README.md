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

**AssetBundleCompiler is not production-ready and is not published on npm yet.**

## Fluent API

// To do

## Notes

### Changing Unity's executable path

By default, _AssetBundleCompiler_ will try to find Unity's executable on the expected locations depending on your platform.

For example, if you use the official Debian package build of Unity, the library will use `/opt/Unity/Editor/Unity`.

If you have a custom installation of Unity on a "non-standard" path, you can tell _AssetBundleCompiler_ where to look:

```typescript
import { setUnityPath } from '@mitm/assetbundlecompiler';

// given that you define the environment variable UNITY_EDITOR_PATH, to avoid hardcoded path:
setUnityPath(process.env.UNITY_EDITOR_PATH);
```

### Unity activation

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
