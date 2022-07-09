import type { NuxtConfig as NuxtConfiguration } from "@nuxt/types";
import type { PresetInterface, PresetProps, Artifacts } from "../../";
import fs from "fs";
import cp from "child_process";
import path from "path";
import jiti from "jiti";
import { getProductionDependencies, getDependency } from "../../../utils/pck";

const allowedNuxtConfigFileNames = ["nuxt.config.ts", "nuxt.config.js"];

const defaultConfig = {
  distDir: ".nuxt",
  generateDir: "dist",
};

/**
 * Nuxt preset for V2 applications. V3 uses nitro behind the scenes,
 * which has Stormkit's preset already built-in.
 */
export default class NuxtPreset implements PresetInterface {
  props: PresetProps;
  defaultServerDist = ".nuxt";
  defaultClientDist = "dist";
  _nuxtConfigName?: string;
  _cachedNuxtConfig?: NuxtConfiguration;

  constructor(props: PresetProps) {
    this.props = props;
  }

  nuxtConfig(): NuxtConfiguration {
    if (this._cachedNuxtConfig) {
      return this._cachedNuxtConfig;
    }

    const { repoDir } = this.props;
    let nuxtConfigFile: string | undefined;

    for (const filename of allowedNuxtConfigFileNames) {
      if (fs.existsSync(path.resolve(repoDir, filename))) {
        nuxtConfigFile = filename;
        this._nuxtConfigName = filename;
        break;
      }
    }

    if (!nuxtConfigFile) {
      const conf: NuxtConfiguration = {
        buildDir: defaultConfig.distDir,
        generate: {
          dir: defaultConfig.generateDir,
        },
      };

      this._cachedNuxtConfig = conf;
      return conf;
    }

    const load = jiti(__filename);
    const mod = load(path.resolve(repoDir, nuxtConfigFile));
    const nuxtConfig = mod.default || mod;

    if (!nuxtConfig.generate?.dir) {
      nuxtConfig.generate = nuxtConfig.generate || {};
      nuxtConfig.generate.dir = defaultConfig.generateDir;
    }

    if (!nuxtConfig.buildDir) {
      nuxtConfig.buildDir = defaultConfig.distDir;
    }

    this._cachedNuxtConfig = nuxtConfig;
    return nuxtConfig;
  }

  installNuxtStart() {
    const installCmd =
      this.props.packageManager === "yarn" ? "yarn add" : "npm i";

    const nuxtVersion = (
      getDependency(this.props.packageJson, "nuxt") || ""
    ).replace(/\^|~/, "");

    console.log(`[sk-step] install nuxt-start`);
    console.log(`installing nuxt-start@${nuxtVersion} to decrease bundle size`);

    cp.execSync(
      `${installCmd} nuxt-start${nuxtVersion ? `@${nuxtVersion}` : ""}`,
      {
        env: { CI: "true", PATH: process.env.PATH },
        cwd: this.props.repoDir,
        stdio: "inherit",
      }
    );
  }

  getBundledModules(): string[] {
    return [
      ...getProductionDependencies(this.props.packageJson),
      ...(
        this.nuxtConfig().modules?.map((value) => {
          if (typeof value === "string") {
            return value;
          }

          if (Array.isArray(value) && typeof value[0] === "string") {
            return value[0];
          }

          return "";
        }) || []
      ).filter((d) => d !== "nuxt"), // we'll install nuxt-start if required
    ];
  }

  async staticApp(): Promise<Artifacts> {
    const config = this.nuxtConfig();

    return {
      clientFiles: [{ pattern: "**/*", cwd: config.generate?.dir }],
    };
  }

  async serverlessApp(): Promise<Artifacts> {
    const config = this.nuxtConfig();
    const bundle = this.getBundledModules();

    if (bundle.length && bundle.indexOf("nuxt-start") === -1) {
      this.installNuxtStart();
      bundle.push("nuxt-start");
    }

    const artifacts: Artifacts = { clientFiles: [], bundle };
    const buildDir = config.buildDir as string;

    if (this._nuxtConfigName) {
      artifacts.serverFiles = [];
      artifacts.serverFiles.push({
        pattern: this._nuxtConfigName,
      });
    }

    if (fs.existsSync(path.join(this.props.repoDir, buildDir, "dist/server"))) {
      artifacts.serverFiles = artifacts.serverFiles || [];
      artifacts.serverFiles.push({
        pattern: path.join(buildDir, "dist/server/**/*"),
      });
    }

    if (fs.existsSync(path.join(this.props.repoDir, buildDir, "dist/client"))) {
      artifacts.clientFiles.push({
        pattern: "**/*",
        cwd: path.join(buildDir, "dist/client"),
      });
    }

    if (fs.existsSync(path.join(this.props.repoDir, "static"))) {
      artifacts.clientFiles.push({ pattern: "**/*", cwd: "static" });
    }

    artifacts.entryFile = "entries/nuxt-v2";
    artifacts.redirects = [{ from: "/_nuxt/*", to: "/*", assets: true }];
    return artifacts;
  }

  async artifacts(): Promise<Artifacts> {
    const { repoDir } = this.props;
    const config = this.nuxtConfig();

    if (fs.existsSync(path.join(repoDir, config.generate?.dir as string))) {
      return this.staticApp();
    }

    return this.serverlessApp();
  }
}
