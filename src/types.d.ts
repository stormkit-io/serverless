export interface NodeRequest {
  url: string; // /relative/path?query=value#hash
  body: string;
  method: string;
  headers: Record<string, string>;
  remoteAddress?: string;
  remotePort?: string;
}

export interface NodeResponse {
  buffer?: string; // Raw http body base64 encoded
  status: number;
  statusMessage: string;
  headers: Record<string, string>;
}
