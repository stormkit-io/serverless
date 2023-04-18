import type { Express } from "express";
import type { ServerlessResponse } from "../response";
import type { RequestEvent } from "../request";
import type { AwsCallback, NodeContext } from "../handlers/stormkit";
import type { App } from "../serverless";
import type { WalkFile } from "./filesys";
import path from "path";
import Request from "../request";
import Response from "../response";
import { matchPath, walkTree } from "./filesys";

export const handleError = (callback: AwsCallback) => (e: Error) => {
  let msg = e && e.message ? e.message : undefined;
  let stack = e && e.stack ? e.stack : undefined;

  // In case it's a string
  if (e && !msg && typeof e === "string") {
    msg = e;
  }

  // Stringify it, if not yet stringified.
  if (typeof msg !== "string") {
    msg = JSON.stringify(e);
  }

  return callback(null, {
    status: 500,
    errorMessage: msg,
    errorStack: stack,
  });
};

let cachedFiles: WalkFile[];

export const handleApi = (
  event: RequestEvent,
  apiDir: string
): Promise<ServerlessResponse> => {
  if (typeof cachedFiles === "undefined") {
    cachedFiles = walkTree(apiDir);
  }

  return new Promise((resolve) => {
    const req = new Request(event);
    const res = new Response(req);

    res.on("sk-end", (data: ServerlessResponse) => {
      resolve(data);
    });

    const requestPath = req.url?.split("?")?.[0]?.replace("/api", "") || "/";
    const file = matchPath(cachedFiles, requestPath, req.method);

    if (file) {
      try {
        const mod = require(path.join(file.path, file.name));
        return mod.default ? mod.default(req, res) : mod(req, res);
      } catch (e) {
        console.error(e);
      }
    }

    res.writeHead(404, "Not found");
    res.end();
  });
};

export const handleSuccess = (
  app: App,
  event: RequestEvent,
  context: NodeContext
): Promise<ServerlessResponse> => {
  // Add support for express apps
  if (app.hasOwnProperty("handle")) {
    // @ts-ignore
    app = app.handle.bind(app) as Express;
  }

  return new Promise((resolve) => {
    const req = new Request(event);
    const res = new Response(req);

    res.on("sk-end", (data: ServerlessResponse) => {
      resolve(data);
    });

    app(req, res, context);
  });
};
