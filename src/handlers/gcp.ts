import http from "node:http";

type App = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  context?: Record<string, any>
) => void;

export default (app: App) => {
  const pck = "@google-cloud/functions-framework";
  import(pck)
    .then((gcp) => {
      gcp.http(process.env.FUNCTION_NAME || "serverless", app);
    })
    .catch(() => {
      console.error("error while loading @google-cloud/functions-framework");
    });
};
