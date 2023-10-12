import type { Request, Response, Handler } from "express";
import type { AlternativeSyntax } from "~/utils/callbacks";
import path from "node:path";
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
    const handler = await opts.moduleLoader(
      `/${path.join(apiDir, route).replace(/^\/+/, "")}`
    );

    Promise.resolve(handler.default(req, res, () => {})).then(
      (r: AlternativeSyntax | void) => {
        if (typeof r !== "undefined" && typeof r === "object") {
          const isBodyAnObject = typeof r.body === "object";

          if (isBodyAnObject) {
            res.setHeader("Content-Type", "application/json");
          }

          Object.keys(r.headers || {}).forEach((key) => {
            res.setHeader(key, r.headers![key]);
          });

          res.status(r.status || r.statusCode || 200);

          if (isBodyAnObject) {
            res.send(JSON.stringify(r.body));
          } else {
            res.send(r.body);
          }
        }
      }
    );

    return;
  }
};
