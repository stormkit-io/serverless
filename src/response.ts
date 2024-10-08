import { Socket } from "node:net";
import { ServerResponse } from "node:http";
import httpParse from "./http-parser";
import Request from "./request";
import createStream from "./stream";

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
        logs: req.logger?.logs(),
      });
    });
  }
}

export default Response;
