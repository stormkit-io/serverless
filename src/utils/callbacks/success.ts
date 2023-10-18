import type { RequestEvent } from "~/request";
import type { ServerlessResponse } from "~/response";
import http from "node:http";
import Request from "~/request";
import Response from "~/response";

type App = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  context?: Record<string, any>
) => void;

export const handleSuccess = (
  app: App,
  event: RequestEvent,
  context: Record<string, any>
): Promise<ServerlessResponse> => {
  // Add support for express apps
  if (app.hasOwnProperty("handle")) {
    // @ts-ignore
    app = app.handle.bind(app) as Express;
  }

  return new Promise((resolve) => {
    const req = new Request(event);
    const res = new Response(req);

    res.on("sk-end", (data: ServerlessResponse) => {
      resolve(data);
    });

    app(req, res, context);
  });
};
