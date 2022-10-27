import type { NodeRequest } from "../../request";
import type { AwsCallback } from "../../handlers/aws-alb";
import type { NodeContext } from "../../serverless";
import { handleApi, handleError } from "../../utils";

export const handler = async (
  event: NodeRequest,
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
