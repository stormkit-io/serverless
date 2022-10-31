import type { Request, Response } from "express";
import type { NodeRequest } from "./request";
import type { App, NodeContext } from "./serverless";
import stormkitHandler from "./handlers/stormkit";
export { fileSystemRouting as matchPath } from "./utils/filesys";

const transformToNodeRequest = (req: Request): NodeRequest => {
  return {
    method: req.method,
    path: req.originalUrl.split(/\?#/)[0],
    url: req.originalUrl,
    body: req.body,
    headers: {},
    context: {},
  };
};

export const serverlessExpress = (
  req: Request,
  res: Response,
  renderFn: App,
  context?: NodeContext
) => {
  const handler = stormkitHandler(renderFn);

  handler(
    transformToNodeRequest(req),
    context || {},
    (e: Error | null, data) => {
      res
        .status(data.status)
        .set(data.headers)
        .end(Buffer.from(data.buffer, "base64").toString("utf-8"));
    }
  );
};
