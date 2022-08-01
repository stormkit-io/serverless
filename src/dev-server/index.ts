import type { NodeRequest } from "../request";
import http from "http";
import path from "path";
import fs from "fs";
import cp from "child_process";
import express from "express";
import { matchPath } from "../utils";
import { NodeResponse } from "~/response";

const wrapper = `
let serverless;

try {
  serverless = require("@stormkit/serverless");
} catch {
  const path = require("path");
  serverless = require(path.join(__dirname, "../serverless"));
}

serverless.default(require(":file").default)(
  :event, {}, (e: any, r: any) => {
    console.log(JSON.stringify(r))
  }
)
`;

export interface DevServerConfig {
  // The port to listen
  port?: number;
  // The host to listen
  host?: string;
  // If provided, the directory will be used as a file-system based routing root.
  dir?: string;
  // If provided, all requests will be forwareded to this file. Has precedence over `dir`.
  file?: string;
  // Whether to wrap the exported function with serverless handler or not. If a `dir`
  // option is provided, this variable defaults true. If a `file` option is provided
  // then this variable defaults false.
  wrapServerless?: boolean;
  // If specified, static files will be served from this folder.
  assetsDir?: string | string[];
  // Path rewrites. Keys are going to be replaced with values.
  rewrite?: Record<string, string>;
}

const defaultConfig: DevServerConfig = {
  dir: process.env.SERVERLESS_DIR || "api",
  host: process.env.SERVERLESS_HOST || "localhost",
  port: Number(process.env.SERVERLESS_PORT) || 3000,
  wrapServerless: true,
};

if (process.env.REPO_PATH) {
  interface PackageJson {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  }

  const packageJson =
    require(`${process.env.REPO_PATH}/package.json`) as PackageJson;

  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  if (deps["next"]) {
    defaultConfig.wrapServerless = false;
    defaultConfig.file = "./entries/next/server";
    defaultConfig.rewrite = { "_next/static/": "/" };
    defaultConfig.assetsDir = [
      path.join(process.env.REPO_PATH, "public"),
      path.join(process.env.REPO_PATH, ".next/static"),
    ];
  } else if (deps["nuxt"]) {
    defaultConfig.wrapServerless = false;
    defaultConfig.file = "./entries/nuxt/server-v2";
    defaultConfig.rewrite = { "/_nuxt": "/" };
    defaultConfig.assetsDir = [
      path.join(process.env.REPO_PATH, "static"),
      path.join(process.env.REPO_PATH, ".nuxt/dist/client"),
    ];
  }
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

class DevServer {
  config: DevServerConfig;

  constructor(config: DevServerConfig) {
    Object.keys(defaultConfig).forEach((k) => {
      const key = k as keyof DevServerConfig;

      if (typeof config[key] === "undefined") {
        // @ts-ignore
        config[key] = defaultConfig[key];
      }
    });

    this.config = config;
  }

  _pathToFileOr404(req: NodeRequest): string | undefined {
    if (this.config.file) {
      return this.config.file;
    }

    const root = path.join(rootDir, this.config.dir || "");
    const file = matchPath(root, req.path);

    if (file) {
      return path.join(file.path, file.name);
    }

    for (const ext of ["ts", "js", "mjs"]) {
      if (fs.existsSync(path.join(root, `404.${ext}`))) {
        return path.join(root, "404");
      }
    }
  }

  async _readBody(req: http.IncomingMessage): Promise<string> {
    const body: string[] = [];

    return new Promise((resolve, _) => {
      if (req.method?.toLowerCase() === "get") {
        return resolve("");
      }

      req.on("data", (chunks) => {
        body.push(chunks.toString("utf-8"));
      });

      req.on("end", () => {
        resolve(body.join(""));
      });
    });
  }

  async _normalizeRequest(req: http.IncomingMessage): Promise<NodeRequest> {
    const headers: Record<string, string> = {};
    const body = await this._readBody(req);

    Object.keys(req.headers).forEach((key) => {
      const headerVal = req.headers[key];
      const headerKey = key.toLowerCase();

      if (Array.isArray(headerVal)) {
        headers[headerKey] = headerVal.join(",");
      } else if (headerVal) {
        headers[headerKey] = headerVal;
      }
    });

    const request: NodeRequest = {
      method: req.method || "get",
      url: req.url || "/",
      path: req.url?.split("?")?.[0] || "/",
      body,
      headers,
    };

    return request;
  }

  listen(): void {
    const { rewrite, assetsDir } = this.config;
    const dirs: string[] = Array.isArray(assetsDir)
      ? assetsDir
      : [assetsDir!].filter((i) => i);

    const app = express();

    if (rewrite) {
      app.use((req, _, next) => {
        Object.keys(rewrite).forEach((key) => {
          req.url = req.url?.replace(key, this.config.rewrite![key]);
        });

        next();
      });
    }

    for (let dir of dirs) {
      app.use(express.static(dir));
    }

    app.all("*", async (req, res) => {
      try {
        const request = await this._normalizeRequest(req);
        const file = this._pathToFileOr404(request);

        if (!file) {
          res.writeHead(404);
          res.write("Page is not found.");
          res.end();
          return;
        }

        // @ts-ignore
        delete request.headers;

        const data: NodeResponse = JSON.parse(
          cp
            .execSync(
              `ts-node -e '${wrapper
                .replace(":file", file)
                .replace(":event", JSON.stringify(request))}'`
            )
            .toString("utf-8")
        );

        Object.keys(data.headers).forEach((key) => {
          res.set(key, data.headers[key]);
        });

        res.status(data.status);
        res.send(Buffer.from(data.buffer || "", "base64").toString("utf-8"));
      } catch (e) {
        console.error(e);
        res.writeHead(500);
        res.write("Something went wrong. Check the logs.");
        res.end();
      }
    });

    app.listen(this.config.port!, this.config.host!, () => {
      console.log(
        `Server running at http://${this.config.host}:${this.config.port}/`
      );
    });
  }
}

// File called is directly, launch a dev-server with default config
if (module.path.endsWith("/dev-server")) {
  new DevServer({}).listen();
}

export default DevServer;
