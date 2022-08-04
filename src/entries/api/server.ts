import type { NodeRequest } from "../../request";
import type { AwsContext, AwsCallback } from "../../handlers/aws-alb";
import { handleApi, handleError } from "../../utils";

export const handler = async (
  event: NodeRequest,
  context: AwsContext,
  callback: AwsCallback
) => {
  // https://www.jeremydaly.com/reuse-database-connections-aws-lambda/
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    callback(null, await handleApi(event, "api"));
  } catch (e) {
    handleError(callback)(e as Error);
  }
};
