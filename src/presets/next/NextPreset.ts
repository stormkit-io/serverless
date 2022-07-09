import type { NextConfig } from "next/types";
import type { PresetInterface, PresetProps, Artifacts, Pattern } from "../";
import fs from "fs";
import path from "path";
import jiti from "jiti";

const nftFileName = "next-server.js.nft.json";

const allowedNextConfigFileNames = [
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
];

interface DefaultNextConfig {
  distDir: string;
  exportDir: string;
}

const defaultConfig: DefaultNextConfig = {
  distDir: ".next",
  exportDir: "out",
};

export default class NextPreset implements PresetInterface {
  props: PresetProps;

  constructor(props: PresetProps) {
    this.props = props;
  }

  nextConfig(): NextConfig {
    const { repoDir } = this.props;
    let nextConfigFile: string | undefined;

    for (const filename of allowedNextConfigFileNames) {
      if (fs.existsSync(path.resolve(repoDir, filename))) {
        nextConfigFile = filename;
        break;
      }
    }

    if (!nextConfigFile) {
      return {
        distDir: defaultConfig.distDir,
      };
    }

    const load = jiti(__filename);
    const mod = load(path.resolve(repoDir, nextConfigFile));
    const config = mod.default || mod;

    if (!config.distDir) {
      config.distDir = defaultConfig.distDir;
    }

    return config;
  }

  requiredFiles(config: NextConfig): Pattern[] {
    const fileName = nftFileName;
    const repoDir = this.props.repoDir;
    const distDir = path.join(repoDir, config.distDir as string);
    const nftFile = path.join(distDir, fileName);

    // If there is an nft file, read the `files` property which is a list of
    // dependencies that needs to be bundled.
    if (fs.existsSync(nftFile)) {
      try {
        return JSON.parse(fs.readFileSync(nftFile).toString("utf-8")).files.map(
          (file: string) => {
            return {
              pattern: path
                .resolve(path.join(distDir, file))
                .split(repoDir)[1]
                .replace(/^\//, ""),
            };
          }
        );
      } catch (e) {
        if (e instanceof Error) {
          console.warn(`Cannot read ${fileName}: ${e.message}`);
        }
      }
    }

    // TODO: traverse package.json dependencies and include the dist files.
    // Also check if the package.json of the module needs to be included or
    // not (probably yes).
    return [];
  }

  async staticApp(): Promise<Artifacts> {
    return {
      clientFiles: [{ pattern: "**/*", cwd: defaultConfig.exportDir }],
    };
  }

  async serverlessApp(): Promise<Artifacts> {
    const config = this.nextConfig();
    const distDir = config.distDir;
    const requiredFiles = this.requiredFiles(config);

    return {
      serverFiles: [
        ...requiredFiles,
        { pattern: "node_modules/react/**/*" }, // next-server.js.nft.json misses some files so include everything
        { pattern: "node_modules/next/dist/**/*" }, // next-server.js.nft.json misses some files so include everything
        { pattern: [`${distDir}/**/*`, `!${distDir}/(cache|static)/**`] },
      ],
      clientFiles: [
        { pattern: "static/**/*", cwd: distDir },
        { pattern: "**/*", cwd: `static` },
        { pattern: "**/*", cwd: `public` },
      ],
      redirects: [{ from: "/_next/static/*", to: "/static/*", assets: true }],
      entryFile: "entries/next",
    };
  }

  async artifacts(): Promise<Artifacts> {
    const { repoDir } = this.props;

    if (fs.existsSync(path.join(repoDir, defaultConfig.exportDir))) {
      return this.staticApp();
    }

    return this.serverlessApp();
  }
}
