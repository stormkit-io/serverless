import type { PresetInterface, PresetProps, Artifacts } from "../";
import fs from "fs";
import path from "path";
import { serverlessLookupFiles } from "./constants";

export default class DefaultPreset implements PresetInterface {
  props: PresetProps;
  distDir: string;

  constructor(props: PresetProps) {
    this.props = props;
    let distDir = this.props.distDir;

    if (!distDir) {
      for (let folder of ["dist", "build", "output"]) {
        if (fs.existsSync(path.join(this.props.repoDir, folder))) {
          distDir = folder;
          break;
        }
      }
    }

    this.distDir = distDir || "./";
  }

  static FunctionHandler(serverDir: string): string {
    for (let file of ["index.mjs", "index.js", "server.js", "server.mjs"]) {
      if (fs.existsSync(path.join(serverDir, file))) {
        return `${file}:handler`;
      }
    }

    return "__sk__server.js:renderer";
  }

  static HasStormkitBuildFolder(props: PresetProps): boolean {
    return fs.existsSync(path.join(props.repoDir, ".stormkit"));
  }

  static ArtifactsFromStormkitBuildFolder(props: PresetProps): Artifacts {
    const stormkitBuildFolder = path.join(props.repoDir, ".stormkit");
    const artifacts: Artifacts = { clientFiles: [] };
    const clientDir = path.join(stormkitBuildFolder, "public");
    const serverDir = path.join(stormkitBuildFolder, "server");

    if (fs.existsSync(clientDir)) {
      artifacts.clientFiles.push({
        pattern: "**/*",
        cwd: ".stormkit/public",
      });
    }

    if (fs.existsSync(serverDir)) {
      artifacts.functionHandler = DefaultPreset.FunctionHandler(serverDir);
      artifacts.serverFiles = [{ pattern: "**/*", cwd: ".stormkit/server" }];
    }

    return artifacts;
  }

  locateServerlessEntryFile(): string | undefined {
    const sources: string[] = [];

    return serverlessLookupFiles.find((fileName) => {
      sources.push(path.join(this.distDir, fileName));

      return fs.existsSync(
        path.join(this.props.repoDir, this.distDir, fileName)
      );
    });
  }

  async artifacts(): Promise<Artifacts> {
    const serverlessEntryFile = this.locateServerlessEntryFile();
    const artifacts: Artifacts = {
      clientFiles: [
        { pattern: ["**/*", "!**/(node_modules|.git)/**"], cwd: this.distDir },
      ],
    };

    if (serverlessEntryFile) {
      artifacts.entryFile = "entries/default";
      artifacts.serverFiles = [
        { pattern: ["**/*", "!**/(node_modules|.git)/**"], cwd: this.distDir },
      ];
    }

    return artifacts;
  }
}
