import type { Serverless } from "../../../types/global";
import type { WalkFile } from "../filesys";
import path from "node:path";
import fs from "node:fs";
import Request from "../../request";
import Response from "../../response";
import { matchPath, walkTree } from "../../utils/filesys";

let cachedFiles: WalkFile[];

export const invokeApiHandler = (
  handler: any,
  req: any,
  res: any
): Promise<Serverless.Response | void> => {
  // Support for both named and default exports: handler
  // Support for both default exports
  const fn = [
    handler?.handler,
    handler?.default?.handler,
    handler?.default,
    handler?.default?.default, // This is a hack for commonjsjs modules that export a default fn as a property of the default export.
    handler,
  ].find((f) => typeof f === "function");

  // Allow function to return a value instead of using `response.end`
  return Promise.resolve(fn(req, res)).then((r: Serverless.ResponseJSON) => {
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

interface StormkitConfig {
  prefixes?: string[];
}

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

    let config: StormkitConfig = {};

    try {
      const data = fs.readFileSync(path.join(apiDir, "stormkit.json"), "utf-8");
      config = JSON.parse(data) as StormkitConfig;
    } catch {
      // No config
    }

    // Remove query and hash from url
    let requestPath =
      "/" + ((req.url || "").split(/[\?#]/)[0] || "").replace(/^\/+/, "");

    if (config.prefixes) {
      for (const prefix of config.prefixes) {
        if (requestPath.startsWith(prefix)) {
          requestPath = requestPath.slice(prefix.length) || "/";
          break;
        }
      }
    }

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
