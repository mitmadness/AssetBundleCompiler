<img src="https://github.com/mitmadness/AssetBundleCompiler/raw/master/abcompiler-logo.png" alt="AssetBundleCompiler logo" align="right">

# [AssetBundle](https://docs.unity3d.com/Manual/AssetBundlesIntro.html)Compiler

Node.js wrapper around Unity3D's BuildPipeline to create AssetBundles programmatically from any files, in order to simplify and automatize your workflow.

From the [documentation](https://docs.unity3d.com/Manual/AssetBundlesIntro.html):

> AssetBundles are files which you can export from Unity to contain Assets of your choice, [that] can be loaded on demand by your application. This allows you to stream content, such as models, Textures, audio clips, or even entire Scenes [...].

----------------

Build automation with Unity's CLI and generating asset bundles gives headaches. If you are integrating asset bundle generation in a Node.js server or want a simple tool to do it, AssetBundleCompiler may satisfy you:

```typescript
await bundle(...assets).for(WebGL).to('/path/to/asset.bundle');
```

 - [Installation & Usage](#installation--usage)
 - [Simple, fluent API](#simple-fluent-api)
 - Notes
    - [Error handling](#error-handling)
    - [Changing Unity's executable path](#changing-unitys-executable-path)
    - [Unity activation](#unity-activation)
    - [Future scope](#future-scope)

----------------

## Installation & Usage

> **AssetBundleCompiler is not production-ready and is not published on npm yet.**

**Requirements:**

 - Node.js, version 7 preferred
 - **An _activated_ installation of Unity on the machine:**
    - If Unity is not installed in the standard path, read [Changing Unity's executable path](#changing-unitys-executable-path)
    - You must activate Unity if not already done, even with a free plan, read [Unity activation](#unity-activation)

## Simple, fluent API

// To do

## Notes

### Error handling

> What could possibly go wrong?

_AssetBundleCompiler_ will catch abnormal Unity process termination and throw an error in that case (and performs a rapid cleanup).
The error is an instance of `UnityCrashError` (exported on the main module) and its prototype looks like:

```typescript
class UnityCrashError extends Error {
    public readonly message: string; // Exception message
    public readonly unityLog: string; // Unity Editor log (contains crash information)
}
```

The logs will also be dumped to you system temporary folder (ie. /tmp) in a file named `unity_crash.abcompiler.log` (the complete path will be reported in the error's message).

Please note that SIGINT and SIGTERM signals are also catched and the same cleanup is performed.

### Changing Unity's executable path

By default, _AssetBundleCompiler_ will try to find Unity's executable on the expected locations. The library will look at the following paths:

 - `/opt/Unity/Editor/Unity` – Debian / Ubuntu [with the official .deb package](https://forum.unity3d.com/threads/unity-on-linux-release-notes-and-known-issues.350256/)
 - `/Applications/Unity/Unity.app/Contents/MacOS/Unity` – MacOS
 - `C:\Program Files (x86)\Unity\Editor\Unity.exe` – Windows, Unity x86
 - `C:\Program Files\Unity\Editor\Unity.exe` – Windows, Unity x64

If you have a custom installation of Unity on a "non-standard" path (ie. you have multiple versions installed), you can tell _AssetBundleCompiler_ where to look:

```typescript
import { setUnityPath } from '@mitm/assetbundlecompiler';

// given that you define the environment variable UNITY_EDITOR_PATH, to avoid hardcoded path:
setUnityPath(process.env.UNITY_EDITOR_PATH);
```

### Unity activation

// To do

### Future scope

 - Stop relying on `fs.ReadStream` and `fs.WriteStream` on the public API, and use normal streams.
 - Implement a StreamWriter interface?
 - Implement a vinyl/Gulp-compatible interface?
 - Generate multiple asset bundles at the time, spawning only one Unity process.
 - When generating multiple ABs at the same time, handle multiple temporary projects to exploit multi-cores CPUs better.
 - CLI interface
 - Web interface
 - Catch process termination signals and errors to cleanup the temporary project
 - Support generating multiple AssetBundle with different build targets at a time
