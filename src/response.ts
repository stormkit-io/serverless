import { Socket } from "net";
import { ServerResponse } from "http";
import httpParse from "./http-parser";
import Request from "./request";
import createStream from "./stream";

export interface ServerlessResponse {
  buffer?: string; // Raw http body base64 encoded
  body?: string; // Response body returned as string. Either this or `buffer` is used.
  status?: number;
  statusMessage?: string;
  headers?: Record<string, string | string[]>;
}

class Response extends ServerResponse {
  constructor(req: Request) {
    super(req);

    this.shouldKeepAlive = false;
    this.chunkedEncoding = false;
    this.useChunkedEncodingByDefault = false;

    const stream = createStream(req);

    this.assignSocket(stream as unknown as Socket);

    const response = this;

    this.on("prefinish", () => {
      const parsed = httpParse(Buffer.concat(stream.buffer));

      parsed.headers.connection = "close";

      ["accept-ranges", "transfer-encoding"].forEach((ignoredKey) => {
        delete parsed.headers[ignoredKey];
      });

      response.socket?.destroy();

      response.emit("sk-end", {
        buffer: parsed.buffer?.toString("base64"),
        headers: parsed.headers,
        statusMessage: parsed.statusMessage || "OK",
        status: parsed.statusCode || 200,
      });
    });
  }
}

export default Response;
