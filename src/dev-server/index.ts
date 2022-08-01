import type { NodeRequest } from "../request";
import http from "http";
import path from "path";
import fs from "fs";
import cp from "child_process";
import express from "express";
import { NodeResponse } from "~/response";

const wrapper = `
let serverless;
const root = ":root"

try {
  serverless = require("@stormkit/serverless");
} catch {
  const path = require("path");
  serverless = require(path.join(path.dirname(root), "src/serverless"));
}

serverless.handleApi(:event, root).then((data: any) => console.log(JSON.stringify(data)))
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
        const root = path.join(rootDir, this.config.dir || "");

        const data: NodeResponse = JSON.parse(
          cp
            .execSync(
              `ts-node -e '${wrapper
                .replace(":root", root)
                .replace(":event", JSON.stringify(request))}'`
            )
            .toString("utf-8")
        );

        Object.keys(data.headers || {}).forEach((key) => {
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

const req =
  typeof __non_webpack_require__ !== "undefined"
    ? __non_webpack_require__
    : require;

// File called is directly, launch a dev-server with default config
if (req?.main?.path.endsWith("/dev-server")) {
  new DevServer({}).listen();
}

export default DevServer;
