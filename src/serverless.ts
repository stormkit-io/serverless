import http from "node:http";
import handlerAws from "./handlers/aws";
import handlerGcp from "./handlers/gcp";

export { RequestEvent } from "./request";
export { ServerlessResponse } from "./response";
export type App = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  context?: Record<string, any>
) => void;

export default (app: App): any => {
  if (process.env.FUNCTION_SIGNATURE_TYPE && process.env.FUNCTION_TARGET) {
    return handlerGcp(process.env.FUNCTION_NAME || "serverless", app);
  }

  // Otherwise fallback to AWS.
  return handlerAws(app);
};
