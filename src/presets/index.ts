import fs from "fs";
import path from "path";
import NextPreset from "./next/NextPreset";
import DefaultPreset from "./default/DefaultPreset";
import NuxtPreset from "./nuxt/NuxtPreset";
import AngularPreset from "./angular/AngularPreset";

export interface PackageJson {
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  bundleDepedencies?: string[];
  bundledDependencies?: string[];
}

interface Redirect {
  to: string;
  from: string;
  status?: number;
  assets?: boolean;
  headers?: Record<string, string>;
}

export interface PresetProps {
  repoDir: string;
  packageManager?: "yarn" | "npm";
  packageJson: PackageJson;
  distDir?: string;
}

export interface PresetInterface {
  artifacts(): Promise<Artifacts>;
}

export interface Pattern {
  pattern: string | string[];
  cwd?: string;
}

export interface Artifacts {
  /**
   * Path to the serverless wrapper file. This should only be provided
   * if the application is going to be run from serverless functions.
   */
  entryFile?: string;

  /**
   * List of redirects.
   */
  redirects?: Redirect[];

  /**
   * List of client files that will be upload to the CDN. Glob pattern is supported.
   */
  clientFiles: Pattern[];

  /**
   * List of files that will be upload to the lambda function. Glob pattern is supported.
   */
  serverFiles?: Pattern[];

  /**
   * List of node modules that will be packed using `npm-pack`.
   */
  bundle?: string[];

  /**
   * Entry file and exported function for the serverless entry file in
   * file:handler name format. For instance, index.mjs:handler.
   */
  functionHandler?: string;
}

interface Props extends Omit<PresetProps, "packageJson" | "packageManager"> {}

const packageNameToPresetMap: Record<string, any> = {
  next: NextPreset,
  nuxt: NuxtPreset,
  nuxt3: NuxtPreset,
  "@angular/core": AngularPreset,
};

export default async function (props: Props): Promise<Artifacts> {
  let packageManager: "npm" | "yarn";
  let packageJson: PackageJson;
  let preset: PresetInterface | undefined;

  try {
    packageJson = JSON.parse(
      fs
        .readFileSync(path.join(props.repoDir, "package.json"))
        .toString("utf-8")
    );
  } catch {
    throw new Error(`Cannot read package.json in path: ${props.repoDir}`);
  }

  if (fs.existsSync(path.join(props.repoDir, "yarn.lock"))) {
    packageManager = "yarn";
  } else {
    packageManager = "npm";
  }

  const presetProps: PresetProps = { ...props, packageJson, packageManager };

  if (DefaultPreset.HasStormkitBuildFolder(presetProps)) {
    return Promise.resolve(
      DefaultPreset.ArtifactsFromStormkitBuildFolder(presetProps)
    );
  }

  for (let key in packageNameToPresetMap) {
    if (packageJson.dependencies?.[key] || packageJson.devDependencies?.[key]) {
      preset = new packageNameToPresetMap[key](presetProps) as PresetInterface;
      break;
    }
  }

  if (!preset) {
    preset = new DefaultPreset(presetProps);
  }

  const artifacts = await preset.artifacts();

  if (DefaultPreset.HasApiSubfolder(presetProps)) {
    artifacts.serverFiles = artifacts.serverFiles || [];
    artifacts.serverFiles.push({ pattern: "api/**/*", cwd: ".stormkit" });
  }

  return artifacts;
}
