import http from "node:http";
import type { RequestEvent } from "../request";
import { handleSuccess } from "../utils/callbacks/success";
import { handleError } from "../utils/callbacks/error";

export type AwsCallback = (e: Error | null, data: any) => void;

type AWSHandler = (
  request: RequestEvent,
  context: Record<string, any>,
  callback: AwsCallback
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
