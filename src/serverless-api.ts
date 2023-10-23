import type { RequestEvent } from "./request";
import type { AwsCallback } from "./handlers/aws";
import { handleApi } from "./utils/callbacks/api";
import { handleError } from "./utils/callbacks/error";
import expressMiddleware from "./middlewares/express";
import handlerGcp from "./handlers/gcp";

export { RequestEvent } from "./request";
export { ServerlessResponse } from "./response";

type HandlerFunction = any;

export default (dirname: string): HandlerFunction => {
  if (process.env.GOOGLE_FUNCTION_TARGET) {
    return handlerGcp(
      process.env.FUNCTION_NAME || "serverless",
      expressMiddleware({ apiDir: dirname, moduleLoader: require })
    );
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
