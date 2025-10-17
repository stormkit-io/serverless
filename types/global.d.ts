import * as http from "http";

declare namespace Serverless {
  export interface Log {
    level: "info" | "error";
    msg: string;
    ts: number;
  }

  export interface RequestEvent {
    url: string; // /relative/path?query=value#hash
    path: string; // /relative/path
    body: string;
    method: string;
    headers: http.IncomingHttpHeaders;
    remoteAddress?: string;
    remotePort?: string;
    captureLogs?: boolean;
    context?: Record<string, any>;
  }

  export interface Response {
    buffer?: string; // Raw http body base64 encoded
    body?: string; // Response body returned as string. Either this or `buffer` is used.
    status?: number;
    statusMessage?: string;
    headers?: Record<string, string | string[]>;
    logs?: Log[];
  }

  export interface ResponseJSON {
    body?: string | Record<string, any>;
    headers?: Record<string, string | string[]>;
    statusCode?: number;
    status?: number; // Alias for statusCode
  }

  export type App = (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context?: Record<string, any>
  ) => void;

  export type AwsCallback = (e: Error | null, data: any) => void;
}
