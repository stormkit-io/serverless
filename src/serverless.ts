import awsAlbHandler from "./handlers/aws-alb";
import stormkitHandler from "./handlers/stormkit";

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

export default function (
  app: App,
  handler: HandlerType = defaultHandler
): StormkitHandler | AwsAlbHandler {
  switch (handler) {
    case handlers.awsAlb:
      return awsAlbHandler(app);
    default:
      return stormkitHandler(app);
  }
}