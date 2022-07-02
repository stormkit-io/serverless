export interface DevServerConfig {
  // The port to listen
  port?: number;
  // The host to listen
  host?: string;
  // If provided, the directory will be used as a file-system based routing root.
  dir?: string;
  // If provided, all requests will be forwareded to this file. Has precedence over `dir`.
  file?: string;
  // Whether to wrap the exported function with serverless handler or not. If a `dir`
  // option is provided, this variable defaults true. If a `file` option is provided
  // then this variable defaults false.
  wrapServerless?: boolean;
  // If specified, static files will be served from this folder.
  assetsDir?: string | string[];
  // Path rewrites. Keys are going to be replaced with values.
  rewrite?: Record<string, string>;
}

export class DevServer {
  listen(): void;
}
