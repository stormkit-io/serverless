declare var __non_webpack_require__ = require;

declare type App = (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => void;

declare interface NodeRequest {
  url: string; // /relative/path?query=value#hash
  path: string; // /relative/path
  body: string;
  method: string;
  headers: Record<string, string>;
  remoteAddress?: string;
  remotePort?: string;
}

declare interface NodeResponse {
  buffer?: string; // Raw http body base64 encoded
  status: number;
  statusMessage: string;
  headers: Record<string, string | string[]>;
}
