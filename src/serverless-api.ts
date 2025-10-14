import type { Serverless } from "../types/global";
import { handleApi } from "./utils/callbacks/api";
import { handleError } from "./utils/callbacks/error";

type HandlerFunction = any;

export default (dirname: string): HandlerFunction => {
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
