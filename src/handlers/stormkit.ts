import type { App } from "../serverless";
import type { NodeRequest } from "../request";
import type { AwsContext, AwsCallback } from "./aws-alb";
import { handleSuccess, handleError } from "../utils";

export type StormkitHandler = (
  request: NodeRequest,
  context: AwsContext,
  callback: AwsCallback
) => Promise<void>;

interface Context {
  callbackWaitsForEmptyEventLoop?: boolean;
}

export default (app: App): StormkitHandler =>
  async (event, context, callback) => {
    // https://www.jeremydaly.com/reuse-database-connections-aws-lambda/
    context.callbackWaitsForEmptyEventLoop = false;

    try {
      callback(null, await handleSuccess(app, event));
    } catch (e) {
      handleError(callback)(e as Error);
    }
  };
