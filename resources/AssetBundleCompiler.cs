using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;

public static class AssetBundleCompiler
{
    public static void Convert()
    {
        //=> Retrieve CLI arguments
        var args = GetCommandLineArgs();

        var tempAssetsDirectory = args["cTempAssetsDirectory"][0];
        var assetNames = args["cAssetNames"];
        var assetBundleDirectory = args["cAssetBundleDirectory"][0];
        var assetBundleName = args["cAssetBundleName"][0];
        var assetBundleTargetName = args["cAssetBundleTarget"][0];

        //=> Parametrize our build
        var ds = Path.DirectorySeparatorChar;

        var build = new AssetBundleBuild {
            assetBundleName = assetBundleName,
            assetNames = assetNames.Select(assetName => "Assets" + ds + tempAssetsDirectory + ds + assetName).ToArray()
        };

        var builds = new[] { build };

        //=> Convert build target name to Unity's BuildTarget enum
        BuildTarget buildTarget;
        try {
            buildTarget = (BuildTarget)Enum.Parse(typeof(BuildTarget), assetBundleTargetName, true);
        } catch (ArgumentException ex) {
            throw new Exception("Invalid build target " + assetBundleTargetName, ex);
        }

        //=> Start asset bundling
        BuildPipeline.BuildAssetBundles(assetBundleDirectory, builds, BuildAssetBundleOptions.None, buildTarget);
    }

    public static Dictionary<string, List<string>> GetCommandLineArgs()
    {
        var args = Environment.GetCommandLineArgs();
        var argsDict = new Dictionary<string, List<string>>();

        for (var i = 0; i < args.Length; i++) {
            if (!args[i].StartsWith("-")) continue;

            var argName = args[i].Substring(1);
            var argValues = new List<string>();

            argsDict[argName] = argValues;

            while (i + 1 < args.Length && !args[i + 1].StartsWith("-")) {
                argValues.Add(args[++i]);
            }
        }

        return argsDict;
    }
}
