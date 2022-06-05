import http from "http";
import path from "path";
import serverless from "../index";
import { matchPath } from "../utils";

const hostname = process.env.SERVERLESS_HOST || "localhost";
const port = Number(process.env.SERVERLESS_PORT) || 3030;
const apiDir = process.env.SERVERLESS_DIR || "api";

class ResponseError extends Error {
  status?: number;
}

const readBody = (req: http.IncomingMessage): Promise<string> => {
  const body: string[] = [];

  return new Promise((resolve, reject) => {
    req.on("data", (chunks) => {
      body.push(chunks.toString("utf-8"));

      // Too much POST data, kill the connection!
      // 2e6 === 2 * Math.pow(10, 6) === 2 * 1000000 ~~~ 2MB
      if (body.length > 2e6) {
        const err = new ResponseError("Request body too long");
        err.status = 400;
        reject(err);
      }
    });

    resolve(body.join(""));
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

const server = http.createServer(async (req, res) => {
  try {
    const request = await normalizeRequest(req);
    const file = matchPath(path.join(__dirname, apiDir), request.path);

    if (!file) {
      const err = new ResponseError("Page not found!");
      err.status = 404;
      throw err;
    }

    const api = require(path.join(file.path, file.name)).default;

    await serverless(api)(request, {}, (_, data) => {
      res.writeHead(data.status, data.headers);
      res.write(Buffer.from(data.buffer || "", "base64").toString("utf-8"));
      res.end();
    });
  } catch (e) {
    if (e instanceof ResponseError) {
      res.writeHead(e.status || 500);
      res.write(e.message);
      res.end();
      return;
    }

    if (e instanceof Error && e.name === "MODULE_NOT_FOUND") {
      res.writeHead(404);
      res.write("Page not found");
      res.end();
      return;
    }

    res.writeHead(500);
    res.write(e);
    res.end();
  }
});

server.listen(port, hostname, undefined, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
