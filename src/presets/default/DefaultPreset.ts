import type { PresetInterface, PresetProps, Artifacts } from "../";
import fs from "fs";
import path from "path";
import { serverlessLookupFiles } from "./constants";

export default class DefaultPreset implements PresetInterface {
  props: PresetProps;
  distDir: string;

  constructor(props: PresetProps) {
    this.props = props;
    this.distDir = this.props.distDir || "./";
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
