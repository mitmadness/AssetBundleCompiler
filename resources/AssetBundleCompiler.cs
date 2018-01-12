using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;

// ReSharper disable once UnusedMember.Global, CheckNamespace
public static class AssetBundleCompiler
{
    public static void Convert()
    {
        //=> Retrieve CLI arguments
        var args = GetCommandLineArgs();

        var assetNames = args["cAssetNames"];
        var assetBundleDirectory = args["cAssetBundleDirectory"][0];
        var assetBundleName = args["cAssetBundleName"][0];
        var assetBundleBuildOptions = args["cAssetBundleBuildOptions"];
        var assetBundleTargetName = args["cAssetBundleTarget"][0];

        //=> Parametrize our build
        var ds = Path.DirectorySeparatorChar;

        var build = new AssetBundleBuild {
            assetBundleName = assetBundleName,
            assetNames = assetNames.Select(assetName => "Assets" + ds + "CopiedAssets" + ds + assetName).ToArray()
        };

        var builds = new[] { build };

        //=> Convert build options strings to a BuildAssetBundleOptions mask
        var buildOptions = GetBuildOptionsMaskFromStrings(assetBundleBuildOptions);

        //=> Convert build target name to Unity's BuildTarget enum
        var buildTarget = StringToEnum<BuildTarget>(assetBundleTargetName);

        //=> Start asset bundling
        BuildPipeline.BuildAssetBundles(assetBundleDirectory, builds, buildOptions, buildTarget);
    }

    private static BuildAssetBundleOptions GetBuildOptionsMaskFromStrings(IEnumerable<string> options)
    {
        return options.Aggregate(
            BuildAssetBundleOptions.None,
            (current, option) => current | StringToEnum<BuildAssetBundleOptions>(option)
        );
    }

    private static T StringToEnum<T>(string enumMemberName)
    {
        try {
            return (T)Enum.Parse(typeof(T), enumMemberName, true);
        } catch (ArgumentException ex) {
            throw new Exception("Invalid member name " + enumMemberName + " for enum " + typeof(T).Name, ex);
        }
    }

    private static Dictionary<string, List<string>> GetCommandLineArgs()
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
