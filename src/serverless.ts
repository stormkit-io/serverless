import type { Serverless } from "../types/global";
import handlerAws from "./handlers/aws";

export default (app: Serverless.App): any => {
  if (process.env.FUNCTION_SIGNATURE_TYPE && process.env.FUNCTION_TARGET) {
    return import("./handlers/gcp").then(({ default: fn }) => fn(app));
  }

  // Otherwise fallback to AWS.
  return handlerAws(app);
};
