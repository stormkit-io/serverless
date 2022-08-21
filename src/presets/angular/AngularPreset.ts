import type { PresetInterface, PresetProps, Artifacts } from "../presets";
import path from "path";
import fs from "fs";

export interface AngularJSON {
  version: string;
  defaultProject: string;
  projects: {
    [projectName: string]: {
      architect?: {
        build?: {
          options?: {
            outputPath: string;
          };
        };
        server?: {
          options?: {
            outputPath: string;
            main: string;
          };
        };
      };
    };
  };
}

export default class AngularPreset implements PresetInterface {
  props: PresetProps;
  _ng?: AngularJSON;

  constructor(props: PresetProps) {
    this.props = props;
  }

  angularJson(): AngularJSON {
    if (this._ng) {
      return this._ng;
    }

    try {
      const filePath = path.join(this.props.repoDir, "angular.json");
      this._ng = JSON.parse(fs.readFileSync(filePath, "utf-8")) as AngularJSON;
      this.validateAngularJson(this._ng);
      return this._ng;
    } catch {
      throw new Error("Cannot locate angular.json in repository root.");
    }
  }

  validateAngularJson(ng: AngularJSON) {
    if (!ng.defaultProject) {
      throw new Error(
        "Property defaultProject is empty in angular.json. " +
          "Make sure to specify the name of the default project to be built on Stormkit."
      );
    }

    const project = ng.projects[ng.defaultProject];

    if (!project) {
      throw new Error(
        `Cannot find project configuration for ${ng.defaultProject}` +
          "Stormkit uses that property to understand the project configuration. " +
          "If you have multiple applicaations, consider creating different apps on Stormkit."
      );
    }

    const clientOutputPath = project.architect?.build?.options?.outputPath;

    if (!clientOutputPath) {
      throw new Error(
        "The property architect.build.options.outputPath is missing in the angular.json file. " +
          "Stormkit uses that property to understand the client output directory."
      );
    }
  }

  async serverlessApp(): Promise<Artifacts> {
    const ng = this.angularJson();
    const project = ng.projects[ng.defaultProject];
    const clientDistDir = project.architect?.build?.options?.outputPath;
    const buildDir = project.architect?.server?.options?.outputPath || "";

    return {
      bundle: ["@angular/core"],
      serverFiles: [
        { pattern: "angular.json" },
        { pattern: [`${buildDir}/**/*`, "!**/(node_modules|.git)/**"] },
        // ng needs client side files inside the server package
        { pattern: [`${clientDistDir}/**/*`, "!**/(node_modules|.git)/**"] },
      ],
      clientFiles: [
        // but we are going to add them to client side as well to reduce serverless calls
        {
          pattern: [
            `**/*`,
            "!**/(node_modules|.git)/**",
            "!**/*.html", // exclude html files to avoid Stormkit serving directly these files
          ],
          cwd: clientDistDir,
        },
      ],
      entryFile: "entries/angular",
    };
  }

  async staticApp(): Promise<Artifacts> {
    const ng = this.angularJson();
    const project = ng.projects[ng.defaultProject];
    const clientDistDir = project.architect?.build?.options?.outputPath;

    return {
      clientFiles: [
        { pattern: ["**/*", "!**/(node_modules|.git)/**"], cwd: clientDistDir },
      ],
    };
  }

  async artifacts(): Promise<Artifacts> {
    const ng = this.angularJson();
    const project = ng.projects[ng.defaultProject];
    const clientDistDir = project.architect?.build?.options?.outputPath;
    const buildDir = project.architect?.server?.options?.outputPath || "";

    // Then it's serverless environment
    if (fs.existsSync(path.join(this.props.repoDir, buildDir))) {
      return this.serverlessApp();
    }

    if (
      !clientDistDir ||
      !fs.existsSync(path.join(this.props.repoDir, clientDistDir))
    ) {
      throw new Error(
        `Cannot locate the ng dist folder. Lookup source: ${clientDistDir}`
      );
    }

    return this.staticApp();
  }
}
