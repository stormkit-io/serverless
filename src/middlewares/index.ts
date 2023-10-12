import apiMiddlewareExpress from "./express";
import path from "node:path";
import fs from "node:fs";

interface Options {
  apiDir?: string;
  moduleLoader?: (path: string) => Promise<Record<string, any>>;
  middleware?: "express";
}

const rootDir = ((): string => {
  let dir = require?.main?.filename || process.cwd();

  if (dir.indexOf("node_modules") > -1) {
    return /^(.*?)node_modules/.exec(dir)?.[1] || dir;
  }

  while (dir !== "/") {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return dir;
    }

    dir = path.dirname(dir);
  }

  return dir;
})();

export default function ({
  moduleLoader,
  apiDir = path.join(rootDir, "api"),
  middleware = "express",
}: Options) {
  if (!moduleLoader) {
    throw new Error(
      `Missing module loader. This middleware requires a module loader like vite.ssrLoadModule.`
    );
  }

  if (middleware === "express") {
    return apiMiddlewareExpress({ apiDir, moduleLoader });
  }

  throw new Error(
    "Unsupported middleware. Open an issue at https://github.com/stormkit-io/serverless/issues to add support for your favorite framework."
  );
}
