import http from "http";
import path from "path";
import fs from "fs";
import serverless from "../index";
import { matchPath } from "../utils";

const hostname = process.env.SERVERLESS_HOST || "localhost";
const port = Number(process.env.SERVERLESS_PORT) || 3030;
const apiDir = process.env.SERVERLESS_DIR || "api";

const readBody = (req: http.IncomingMessage): Promise<string> => {
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
};

const normalizeRequest = async (
  req: http.IncomingMessage
): Promise<NodeRequest> => {
  const headers: Record<string, string> = {};
  const body = await readBody(req);

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

const callApi = (
  api: App,
  request: NodeRequest,
  res: http.ServerResponse
): Promise<void> => {
  const handler = serverless(api) as StormkitHandler;

  return handler(request, {}, (_: Error | null, data: NodeResponse) => {
    res.writeHead(data.status, data.headers);
    res.write(Buffer.from(data.buffer || "", "base64").toString("utf-8"));
    res.end();
  });
};

const server = http.createServer(async (req, res) => {
  try {
    const request = await normalizeRequest(req);
    const file = matchPath(path.join(rootDir, apiDir), request.path);

    if (!file) {
      try {
        const api = _require(path.join(rootDir, apiDir, "404")).default;
        await callApi(api, request, res);
      } catch {
        res.writeHead(404, "Page not found");
        res.end("Page not found!");
      }

      return;
    }

    const api = _require(path.join(file.path, file.name)).default;
    await callApi(api, request, res);
  } catch (e) {
    console.error(e);
    res.writeHead(500);
    res.write("Something went wrong. Check the logs.");
    res.end();
  }
});

server.listen(port, hostname, undefined, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
