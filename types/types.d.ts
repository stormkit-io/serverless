declare type Callback = (e: Error | null, data: any) => void;
declare type SupportedApps = App | Express;

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
