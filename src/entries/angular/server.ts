import path from "path";
import fs from "fs";
import serverless from "../../serverless";
import { load } from "../../utils";

interface AngularJSON {
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

let ng: AngularJSON;

try {
  const filePath = path.join(__dirname, "angular.json");
  ng = JSON.parse(fs.readFileSync(filePath, "utf-8")) as AngularJSON;
} catch {
  throw new Error("Cannot locate angular.json in repository root.");
}

const opts = ng.projects[ng.defaultProject].architect?.server?.options;
const serverFileName = `${opts?.outputPath}/main`;

if (!fs.existsSync(path.join(__dirname, `${serverFileName}.js`))) {
  throw new Error(
    `Cannot locate ${serverFileName}. Expecting output file to be named main.js`
  );
}

const { app: ngApp } = load(`./${serverFileName}`);
exports.renderer = serverless(ngApp());
