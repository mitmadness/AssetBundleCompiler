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
 - Notes:
   [Error handling](#error-handling), [Changing Unity's executable path](#changing-unitys-executable-path), [Unity activation](#unity-activation), [Future scope](https://github.com/mitmadness/AssetBundleCompiler/projects/1)

----------------

## Installation & Usage

> **AssetBundleCompiler is not production-ready and is not published on npm yet.**

**Requirements:**

 - Node.js, version 7 preferred
 - **An _activated_ installation of Unity on the machine:**
    - If Unity is not installed in the standard path, read [Changing Unity's executable path](#changing-unitys-executable-path)
    - You must activate Unity if not already done, even with a free plan, read [Unity activation](#unity-activation)

## Simple, fluent API

```typescript
import { BuildTargets, bundle } from '@mitm/assetbundlecompiler';

const { WebGL } = BuildTargets;

await bundle('/abs/path/to/fbx', '/abs/path/to/texture', /* ... */)
    // .for() is mandatory and tells the library what platform your asset bundle targets.
    // You can either pass a predefined constant in BuildTargets, or a string,
    // matching the name of a member of the UnityEditor.BuildTarget enum.
    // @see https://docs.unity3d.com/ScriptReference/BuildTarget.html
    .for(WebGL)
    
    // This lets you define a simple logger to get simple text updates about the conversion.
    .withLogger(message => console.log(message))
    
    // This is the "run" function and marks the termination of the fluent calls
    // by returning a Promise that resolves when the asset bundle generation ends.
    // Give it a path to the asset bundle name or a fs.WriteStream.
    .to('/abs/path/to/assetbundle.bin');
```

(Not recommended) `bundle()` is the normal entry function but you can also use directly the underlying `AssetsBundler` class:

```typescript
const bundler = new AssetsBundler();

await bundler
    .include('/abs/path/to/fbx')
    .include('/abs/path/to/texture')
    .for(WebGL)
    .to('/abs/path/to/assetbundle.bin');
```

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

Unity is a proprietary software that requires to be activated with a valid account, even if that's not necessary for building asset bundles. This library does not handle activation, meaning that you _must_ already have an activated version of Unity on the machine.

**Building asset bundles, does not requires a paid account.** You can log in with your free _Personal_ license.

Activation via Unity's CLI is possible too (for automating installation for example) but is somewhat broken from times to times, and **does not works with personal licenses**. So, given you have a paid accound, you can do:

```
~$ /path/to/Unity -quit -batchmode -serial SB-XXXX-XXXX-XXXX-XXXX-XXXX -username 'JoeBloggs@example.com' -password 'MyPassw0rd'
```
