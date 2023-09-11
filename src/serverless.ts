import type { StormkitHandler, NodeContext } from "./handlers/stormkit";
import http from "node:http";
import stormkitHandler from "./handlers/stormkit";
import { handleApi, handleError } from "./utils/callbacks";
export { RequestEvent } from "./request";
export { ServerlessResponse } from "./response";

export type App = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  context?: NodeContext
) => void;

export default (
  app?: App | string,
  handler?: "stormkit" | "stormkit:api"
): StormkitHandler => {
  switch (handler) {
    case "stormkit:api":
      return async (event, context, callback) => {
        // https://www.jeremydaly.com/reuse-database-connections-aws-lambda/
        context.callbackWaitsForEmptyEventLoop = false;

        try {
          callback(null, await handleApi(event, app as string));
        } catch (e) {
          handleError(callback)(e as Error);
        }
      };

    default:
      if (!app) {
        throw new Error("Stormkit handler requires app to be defined");
      }

      if (typeof app === "string") {
        throw new Error(
          "Stormkit handler expects app to be a handler -- string given."
        );
      }

      return stormkitHandler(app as App);
  }
};
