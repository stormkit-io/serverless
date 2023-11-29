import type { RequestEvent } from "./request";
import type { AwsCallback } from "./handlers/aws";
import { handleApi } from "./utils/callbacks/api";
import { handleError } from "./utils/callbacks/error";
import expressMiddleware from "./middlewares/express";

export { RequestEvent } from "./request";
export { ServerlessResponse } from "./response";

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

  // Otherwise fallback to AWS.
  return async (
    event: RequestEvent,
    context: Record<string, any>,
    callback: AwsCallback
  ) => {
    context.callbackWaitsForEmptyEventLoop = false;

    try {
      callback(null, await handleApi(event, dirname));
    } catch (e) {
      handleError(callback)(e as Error);
    }
  };
};
