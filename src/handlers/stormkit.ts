import { handleSuccess, handleError } from "../utils";

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
