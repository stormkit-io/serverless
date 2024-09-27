import type { Request, Response } from "express";
import { Serverless } from "../global";

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
declare const _default: (
  opts: Options
) => (req: Request, res: Response) => Promise<void>;

export default _default;
