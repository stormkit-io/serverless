import http from "http";
import path from "path";
import fs from "fs";
import express from "express";
import serverless from "~/serverless";
import { matchPath } from "~/utils";
import type { DevServerConfig } from "~/types/bundle/dev-server";

const defaultConfig: DevServerConfig = {
  dir: process.env.SERVERLESS_DIR || "api",
  host: process.env.SERVERLESS_HOST || "localhost",
  port: Number(process.env.SERVERLESS_PORT) || 3000,
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

const _require =
  typeof __non_webpack_require__ !== "undefined"
    ? __non_webpack_require__
    : require;

class DevServer {
  config: DevServerConfig;

  constructor(config: DevServerConfig) {
    Object.keys(defaultConfig).forEach((k) => {
      const key = k as keyof DevServerConfig;

      if (!config[key]) {
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

    if (fs.existsSync(path.join(root, "404"))) {
      return path.join(root, "404");
    }
  }

  async _readBody(req: http.IncomingMessage): Promise<string> {
    const body: string[] = [];

    return new Promise((resolve, reject) => {
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
    const dirs: string[] = Array.isArray(assetsDir) ? assetsDir : [assetsDir!];

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

        const api = _require(file);
        let handler = api.default || api.renderer || api.handler;

        if (this.config.wrapServerless) {
          handler = serverless(handler) as StormkitHandler;
        }

        // TODO: this is a StormkitHandler signature. Add support for other handlers.
        return handler(request, {}, (_: Error | null, data: NodeResponse) => {
          res.writeHead(data.status, data.headers);
          res.write(Buffer.from(data.buffer || "", "base64").toString("utf-8"));
          res.end();
        });
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
if (__non_webpack_require__.main === module) {
  new DevServer({}).listen();
}

export default DevServer;
