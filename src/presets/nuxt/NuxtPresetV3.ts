import type { NuxtConfig as NuxtConfiguration } from "@nuxt/types";
import type { PresetInterface, PresetProps, Artifacts } from "../";
import fs from "fs";
import path from "path";
import { getDependency } from "../../utils/pck";

/**
 * NuxtPresetV3 for testing local applications. In production, nuxt 3
 * uses Stormkit preset.
 */
export default class NuxtPresetV3 implements PresetInterface {
  props: PresetProps;
  _nuxtConfigName?: string;
  _cachedNuxtConfig?: NuxtConfiguration;

  constructor(props: PresetProps) {
    this.props = props;
  }

  async artifacts(): Promise<Artifacts> {
    const artifacts: Artifacts = { clientFiles: [] };
    const buildDir = ".output";

    if (fs.existsSync(path.join(this.props.repoDir, buildDir, "server"))) {
      artifacts.serverFiles = artifacts.serverFiles || [];
      artifacts.serverFiles.push({
        pattern: "**/*",
        cwd: path.join(buildDir, "server"),
      });
    }

    if (fs.existsSync(path.join(this.props.repoDir, buildDir, "public"))) {
      artifacts.clientFiles.push({
        pattern: "**/*",
        cwd: path.join(buildDir, "public"),
      });
    }

    if (fs.existsSync(path.join(this.props.repoDir, "static"))) {
      artifacts.clientFiles.push({ pattern: "**/*", cwd: "static" });
    }

    artifacts.functionHandler = "index.mjs:handler";
    return artifacts;
  }
}
