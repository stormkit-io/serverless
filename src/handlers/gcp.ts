import type { Serverless } from "../../types/global";

export default (app: Serverless.App) => {
  const pck = "@google-cloud/functions-framework";
  import(pck)
    .then((gcp) => {
      gcp.http(process.env.FUNCTION_NAME || "serverless", app);
    })
    .catch(() => {
      console.error("error while loading @google-cloud/functions-framework");
    });
};
