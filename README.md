<img src="https://github.com/mitmadness/AssetBundleCompiler/raw/master/abcompiler-logo.png" alt="AssetBundleCompiler logo" align="right">

# [AssetBundle](https://docs.unity3d.com/Manual/AssetBundlesIntro.html)Compiler

[![npm version](https://img.shields.io/npm/v/@mitm/assetbundlecompiler.svg?style=flat-square)](https://www.npmjs.com/package/@mitm/assetbundlecompiler) ![license](https://img.shields.io/github/license/mitmadness/AssetBundleCompiler.svg?style=flat-square) [![Travis Build](https://img.shields.io/travis/mitmadness/AssetBundleCompiler.svg?style=flat-square)](https://travis-ci.org/mitmadness/AssetBundleCompiler) ![npm total downloads](https://img.shields.io/npm/dt/@mitm/assetbundlecompiler.svg?style=flat-square)

Node.js wrapper around Unity3D's BuildPipeline to create AssetBundles programmatically from any files, in order to simplify and automatize your workflow.

From the [documentation](https://docs.unity3d.com/Manual/AssetBundlesIntro.html):

> AssetBundles are files which you can export from Unity to contain Assets of your choice, [that] can be loaded on demand by your application. This allows you to stream content, such as models, Textures, audio clips, or even entire Scenes [...].

*:point_right: See also: [@mitm/chuck](https://github.com/mitmadness/chuck), a fully-featured webservice that builds asset bundles.*

----------------

Build automation with Unity's CLI and generating asset bundles gives headaches. If you are integrating asset bundle generation in a Node.js server or want a simple tool to do it, AssetBundleCompiler may satisfy you:

```typescript
await bundle(...assets).targeting(WebGL).to('/path/to/asset.bundle');
```

 - [Installation & Usage](#package-installation--usage)
 - [Simple, fluent API](#link-simple-fluent-api)
 - Notes:
   [Error handling](#error-handling), [Changing Unity's executable path](#changing-unitys-executable-path), [Unity activation](#unity-activation), [Future scope](https://github.com/mitmadness/AssetBundleCompiler/projects/1)

----------------

## :package: Installation & Usage

**Requirements:**

 - Node.js, version 7 preferred
 - :warning: **An _activated_ installation of Unity on the machine** :warning:
    - If Unity is not installed in the standard path, read [Changing Unity's executable path](#changing-unitys-executable-path)
    - You must activate Unity if not already done, even with a free plan, read [Unity activation](#unity-activation)

Install it via the npm registry:

```
yarn add @mitm/assetbundlecompiler
```

## :link: Simple, fluent API

```typescript
import { BuildTargets, bundle } from '@mitm/assetbundlecompiler';

const { WebGL } = BuildTargets;

// bundle() is the entry function to the API.
// Pass a list of assets to bundle into the resulting asset bundle.
// Those assets could be anywhere on the filesystem.
// To pass an array of paths, use bundle(...paths) syntax.
await bundle('/abs/path/to/fbx', '/abs/path/to/texture', /* ... */)
    // .targeting() is mandatory and tells the library what platform your asset bundle targets.
    // You can either pass a predefined constant in BuildTargets, or a string,
    // matching the name of a member of the UnityEditor.BuildTarget enum.
    // @see https://docs.unity3d.com/ScriptReference/BuildTarget.html
    .targeting(WebGL)
    
    // Lets you install custom Editor scripts before asset bundle generation.
    // This is very useful, for example, to create an Asset Postprocessor to customize how
    // your resources are imported into the asset bundle, using AssetImporters for example.
    // @see https://docs.unity3d.com/ScriptReference/AssetPostprocessor.html
    .includingEditorScripts('/abs/path/to/script.dll', '/abs/path/to/script.cs')
    
    // Lets you define build options. Those are always flags, and the key names represent
    // member names of the UnityEditor.BuildAssetBundleOptions enum.
    // @see https://docs.unity3d.com/ScriptReference/BuildAssetBundleOptions.html
    .withBuildOptions({ chunkBasedCompression: true, strictMode: true, /* etc */ })
    
    // This lets you define a simple logger to get simple text updates about the conversion.
    .withLogger(message => console.log(message))
    
    // This lets you define a logger for the real-time output of Unity (stdout+stderr).
    // Beware, it's very verbose :)
    .withUnityLogger(message => console.log(`Unity: ${message}`))
    
    // This is the "run" function and marks the termination of the fluent calls
    // by returning a Promise that resolves when the asset bundle generation ends.
    // Give it a path to the asset bundle name or a fs.WriteStream.
    .to('/abs/path/to/resources.assetbundle');
```

You can also retrieve the manifest Unity generates during the build - the manifest contains informations about the asset bundle:

```typescript
// The promise gets resolved with the manifest as a plain JS object
const manifest = await bundle('...').to('...');

/* manifest = { 
    CRC: 2924050344,
    Assets: ['Assets/CopiedAssets/MyAsset.jpg'],
    ...etc...
} */
```

You can also dump the original manifest file (a YAML file) alongside the assetbundle:

```typescript
const manifest = await bundle('...')
    // manifestFile can take a path or a fs.WriteStream too
    .to('/path/to/resources.assetbundle', { manifestFile: '/path/to/resources.assetbundle.manifest' });
```

## :bulb: Notes

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
