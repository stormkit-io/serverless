import type { StormkitHandler } from "./handlers/stormkit";
import type { AwsAlbHandler } from "./handlers/aws-alb";
import http from "http";
import awsAlbHandler from "./handlers/aws-alb";
import stormkitHandler from "./handlers/stormkit";
export { default as Request } from "./request";
export { default as Response } from "./response";

export type NodeContext = Record<string, unknown>;

export type App = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  context?: NodeContext
) => void;

type HandlerType = "awsAlb" | "stormkit";

const handlers: Record<string, HandlerType> = {
  awsAlb: "awsAlb",
  stormkit: "stormkit",
};

const defaultHandler: HandlerType = (() => {
  const handler = process.env.SERVERLESS_HANDLER;

  for (const val of Object.values(handlers)) {
    if (val === handler) {
      return val;
    }
  }

  return handlers.stormkit;
})();

export default (
  app: App,
  handler: HandlerType = defaultHandler
): StormkitHandler | AwsAlbHandler => {
  switch (handler) {
    case handlers.awsAlb:
      return awsAlbHandler(app);
    default:
      return stormkitHandler(app);
  }
};
