import type { RequestEvent } from "../../request";
import type { AwsCallback, NodeContext } from "../../handlers/stormkit";
import { handleApi, handleError } from "../../utils";

export const handler = async (
  event: RequestEvent,
  context: NodeContext,
  callback: AwsCallback
) => {
  // https://www.jeremydaly.com/reuse-database-connections-aws-lambda/
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    callback(null, await handleApi(event, __dirname));
  } catch (e) {
    handleError(callback)(e as Error);
  }
};
