import http from "node:http";
import handlerAws from "./handlers/aws";

export { RequestEvent } from "./request";
export { ServerlessResponse } from "./response";
export type App = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  context?: Record<string, any>
) => void;

export default (app: App): any => {
  if (process.env.FUNCTION_SIGNATURE_TYPE && process.env.FUNCTION_TARGET) {
    try {
      const gcp = require("@google-cloud/functions-framework");
      return gcp.http(process.env.FUNCTION_NAME || "serverless", app);
    } catch {
      console.error("error while loading @google-cloud/functions-framework");
      return;
    }
  }

  // Otherwise fallback to AWS.
  return handlerAws(app);
};
