import type { StormkitHandler, NodeContext } from "./handlers/stormkit";
import http from "node:http";
import stormkitHandler from "./handlers/stormkit";
import { handleApi } from "./utils/callbacks";
export { RequestEvent } from "./request";
export { ServerlessResponse } from "./response";

export type App = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  context?: NodeContext
) => void;

type ReturnTypes = {
  stormkit: StormkitHandler;
  "stormkit:api": typeof handleApi;
};

export default (
  app?: App,
  handler?: keyof ReturnTypes
): ReturnTypes[keyof ReturnTypes] => {
  switch (handler) {
    case "stormkit:api":
      return handleApi;

    default:
      if (!app) {
        throw new Error("Stormkit handler requires app to be defined");
      }

      return stormkitHandler(app);
  }
};
