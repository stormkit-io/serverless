import type { Express } from "express";
import type { NodeResponse } from "../response";
import type { NodeRequest } from "../request";
import type { AwsCallback } from "../handlers/aws-alb";
import type { App } from "../serverless";
import path from "path";
import Request from "../request";
import Response from "../response";
import { matchPath } from "./filesys";
import { load } from "./load";

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

export const handleApi = (
  event: NodeRequest,
  apiDir: string
): Promise<NodeResponse> => {
  return new Promise((resolve) => {
    const req = new Request(event);
    const res = new Response(req);

    res.on("sk-end", (data: NodeResponse) => {
      resolve(data);
    });

    const requestPath = req.url?.split("?")?.[0]?.replace("/api", "") || "/";
    const file = matchPath(apiDir, requestPath);

    if (file) {
      return load<{ default: App }>(path.join(file.path, file.name)).default(
        req,
        res
      );
    }

    res.writeHead(404, "Not found");
    res.end();
  });
};

export const handleSuccess = (
  app: App,
  event: NodeRequest
): Promise<NodeResponse> => {
  // Add support for express apps
  if (app.hasOwnProperty("handle")) {
    // @ts-ignore
    app = app.handle.bind(app) as Express;
  }

  return new Promise((resolve) => {
    const req = new Request(event);
    const res = new Response(req);

    res.on("sk-end", (data: NodeResponse) => {
      resolve(data);
    });

    app(req, res);
  });
};
