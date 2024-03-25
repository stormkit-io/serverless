import type { RequestEvent } from "~/request";
import type { ServerlessResponse } from "~/response";
import type { WalkFile } from "~/utils/filesys";
import path from "node:path";
import Request from "~/request";
import Response from "~/response";
import { matchPath, walkTree } from "~/utils/filesys";

let cachedFiles: WalkFile[];

export interface AlternativeSyntax {
  body?: string;
  headers?: Record<string, string | string[]>;
  statusCode?: number;
  status?: number; // Alias for statusCode
}

export const invokeApiHandler = (
  handler: any,
  req: any,
  res: any
): Promise<ServerlessResponse | void> => {
  const ret = handler?.default ? handler.default(req, res) : handler(req, res);

  // Allow function to return a value instead of using `response.end`
  return Promise.resolve(ret).then((r: AlternativeSyntax) => {
    if (typeof r !== "undefined" && typeof r === "object") {
      const isBodyAnObject = typeof r.body === "object";
      const headers: Record<string, string | string[]> = {};

      if (isBodyAnObject) {
        headers["Content-Type"] = "application/json";
      }

      return {
        body: typeof r.body === "string" ? r.body : JSON.stringify(r.body),
        headers: { ...headers, ...r.headers },
        status: r.statusCode || r.status,
      };
    }
  });
};

export const handleApi = (
  event: RequestEvent,
  apiDir: string
): Promise<ServerlessResponse> => {
  if (typeof cachedFiles === "undefined") {
    cachedFiles = walkTree(apiDir);
  }

  return new Promise(async (resolve) => {
    const req = new Request(event);
    const res = new Response(req);

    res.on("sk-end", (data: ServerlessResponse) => {
      resolve(data);
    });

    // This is what we do here:
    // /api/my-path?query-param => /my-path
    const requestPath =
      req.url?.split(/[\?#]/)[0].split("/").slice(2).join("/") || "/";

    const file = matchPath(cachedFiles, requestPath, req.method);

    if (file) {
      try {
        const mod = require(path.join(file.path, file.name));
        const ret = await invokeApiHandler(mod, req, res);

        if (ret) {
          resolve(ret);
        }

        return;
      } catch (e) {
        console.error(e);
      }
    }

    res.writeHead(404, "Not found");
    res.end();
  });
};
