import type { Express } from "express";
import { NodeRequest, NodeResponse } from "./types";
import Request from "./request";
import Response from "./response";

export type Callback = (e: Error | null, data: any) => void;
export type App = (req: Request, res: Response) => void;
export type SupportedApps = App | Express;

/**
 * Resolve the error message and display the caught error
 * in a nice UI.
 */
export const handleError = (callback: Callback) => (e: Error) => {
  let msg = e && e.message ? e.message : undefined;
  let stack = e && e.stack ? e.stack : undefined;

  // In case it's a string
  if (e && !msg && typeof e === "string") {
    msg = e;
  }

  // Stringify it, if not yet stringified.
  if (typeof msg !== "string") {
    msg = JSON.stringify(e);
  }

  return callback(null, {
    status: 500,
    errorMessage: msg,
    errorStack: stack,
  });
};

export const handleSuccess = (
  app: App,
  event: NodeRequest
): Promise<NodeResponse> => {
  // Add support for express apps
  if (app.hasOwnProperty("handle")) {
    //   @ts-ignore
    app = app.handle.bind(app) as Express;
  }

  return new Promise((resolve) => {
    const req = new Request(event);
    const res = new Response(req);

    res.on("sk-end", (data: NodeResponse) => {
      resolve(data);
    });

    app(req, res);
  });
};
