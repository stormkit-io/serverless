import type { Request, Response } from "express";
import path from "node:path";
import { invokeApiHandler } from "~/utils/callbacks";
import { matchPath } from "~/router";

interface Options {
  apiDir: string;
  moduleLoader: (path: string) => Promise<Record<string, any>>;
}

/**
 * This is an Express middleware for applications wanting to the define
 * API routes programmatically.
 *
 * Example usage:
 *
 * import { apiMiddlewareExpress } from "@stormkit/serverless/middlewares"
 *
 * app.use("/api", apiMiddlewareExpress({ apiDir: "src/api", bundler: "vite" }));
 */
export default (opts: Options) => async (req: Request, res: Response) => {
  const apiDir = opts.apiDir;
  const urlNrm = req.originalUrl.split(/\?|#/)[0].replace("/api", "");
  const route = matchPath(apiDir, urlNrm, req.method);

  if (!route) {
    res.status(404);
    res.send();
    return;
  }

  if (opts.moduleLoader) {
    const handler = await opts.moduleLoader(path.join(apiDir, route));

    invokeApiHandler(handler, req, res).then((data) => {
      if (!data) {
        res.status(200);
        res.end();
        return;
      }

      Object.keys(data.headers || {}).forEach((key) => {
        res.setHeader(key, data.headers![key]);
      });

      res.status(data.status || 200);
      res.send(data.body);
    });

    return;
  }
};
