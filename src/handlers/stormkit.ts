import type { App } from "../serverless";
import type { RequestEvent } from "../request";
import { handleSuccess, handleError } from "../utils";

export type AwsCallback = (e: Error | null, data: any) => void;

export type NodeContext = Record<string, unknown>;

export type StormkitHandler = (
  request: RequestEvent,
  context: NodeContext,
  callback: AwsCallback
) => Promise<void>;

export default (app: App): StormkitHandler =>
  async (event, context, callback) => {
    // https://www.jeremydaly.com/reuse-database-connections-aws-lambda/
    context.callbackWaitsForEmptyEventLoop = false;

    try {
      callback(null, await handleSuccess(app, event, context));
    } catch (e) {
      handleError(callback)(e as Error);
    }
  };
