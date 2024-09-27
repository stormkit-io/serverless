import type { Serverless } from "../types/global";
import { handleApi } from "./utils/callbacks/api";
import { handleError } from "./utils/callbacks/error";
import expressMiddleware from "./middlewares/express";

type HandlerFunction = any;

export default (dirname: string): HandlerFunction => {
  if (process.env.FUNCTION_SIGNATURE_TYPE && process.env.FUNCTION_TARGET) {
    try {
      const gcp = require("@google-cloud/functions-framework");

      return gcp.http(
        process.env.FUNCTION_TARGET || "serverless",
        expressMiddleware({ apiDir: dirname, moduleLoader: (p) => require(p) })
      );
    } catch {
      console.error("error while loading @google-cloud/functions-framework");
      return;
    }
  }

  // Otherwise fallback to default syntax.
  return async (
    event: Serverless.RequestEvent | Buffer,
    context: Record<string, any>,
    callback: Serverless.AwsCallback
  ) => {
    context.callbackWaitsForEmptyEventLoop = false;

    // Alibaba sends a buffer instead of a string.
    const e = Buffer.isBuffer(event) ? JSON.parse(event.toString()) : event;

    try {
      callback(null, await handleApi(e, dirname));
    } catch (e) {
      handleError(callback)(e as Error);
    }
  };
};
