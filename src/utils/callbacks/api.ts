import type { Serverless } from "../../../types/global";
import type { WalkFile } from "../filesys";
import path from "node:path";
import Request from "../../request";
import Response from "../../response";
import { matchPath, walkTree } from "../../utils/filesys";

let cachedFiles: WalkFile[];

export const invokeApiHandler = (
  handler: any,
  req: any,
  res: any
): Promise<Serverless.Response | void> => {
  const ret =
    typeof handler?.default === "function"
      ? handler.default(req, res)
      : handler(req, res);

  // Allow function to return a value instead of using `response.end`
  return Promise.resolve(ret).then((r: Serverless.ResponseJSON) => {
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
  event: Serverless.RequestEvent,
  apiDir: string
): Promise<Serverless.Response> => {
  if (typeof cachedFiles === "undefined") {
    cachedFiles = walkTree(apiDir);
  }

  return new Promise(async (resolve) => {
    const req = new Request(event);
    const res = new Response(req);

    res.on("sk-end", (data: Serverless.Response) => {
      resolve(data);
    });

    // This is what we do here:
    // /api/my-path?query-param => /my-path
    const requestPath =
      "/" + (req.url?.split(/[\?#]/)[0].split("/").slice(2).join("/") || "");

    const file = matchPath(cachedFiles, requestPath, req.method);

    if (file) {
      try {
        const mod = await import(path.join(file.path, file.name));
        const ret = await invokeApiHandler(mod, req, res);

        if (ret) {
          resolve({ ...ret, logs: req.logger?.logs() });
        }

        return;
      } catch (e) {
        if (
          e instanceof Error &&
          e.message?.includes("handler is not a function")
        ) {
          console.error(
            "API Function does not export a default method. See https://www.stormkit.io/docs/features/writing-api for more information."
          );
        } else {
          console.error(e);
        }
      }
    }

    res.writeHead(404, "Not found");
    res.end();
  });
};
