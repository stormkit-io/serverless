import { handleSuccess, handleError } from "../utils";

interface Context {
  callbackWaitsForEmptyEventLoop?: boolean;
}

export default (app: App) =>
  async (event: NodeRequest, context: Context, callback: Callback) => {
    // https://www.jeremydaly.com/reuse-database-connections-aws-lambda/
    context.callbackWaitsForEmptyEventLoop = false;

    try {
      callback(null, await handleSuccess(app, event));
    } catch (e) {
      handleError(callback)(e as Error);
    }
  };
