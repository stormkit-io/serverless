import type { Serverless } from "../../types/global";
import http from "node:http";
import { handleSuccess } from "../utils/callbacks/success";
import { handleError } from "../utils/callbacks/error";

type AWSHandler = (
  request: Serverless.RequestEvent,
  context: Record<string, any>,
  callback: Serverless.AwsCallback
) => Promise<void>;

type App = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  context?: Record<string, any>
) => void;

export default (app: App): AWSHandler =>
  async (event, context, callback) => {
    // Alibaba sends a buffer instead of a string.
    const e = Buffer.isBuffer(event) ? JSON.parse(event.toString()) : event;

    // https://www.jeremydaly.com/reuse-database-connections-aws-lambda/
    context.callbackWaitsForEmptyEventLoop = false;

    try {
      callback(null, await handleSuccess(app, e, context));
    } catch (e) {
      handleError(callback)(e as Error);
    }
  };
