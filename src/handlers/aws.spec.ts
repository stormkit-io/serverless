import type { Serverless } from "../../types/global";
import http from "node:http";
import handler from "../handlers/aws";
import Request from "../request";
import Response from "../response";
import { mockRequestEvent, mockMainJs, decodeString } from "../utils/testing";

describe("handlers/aws.ts", () => {
  let request: Serverless.RequestEvent;

  beforeEach(() => {
    request = mockRequestEvent();
  });

  test("request should receive correct properties", (done) => {
    handler((req: http.IncomingMessage, res: http.ServerResponse) => {
      res.end(
        JSON.stringify({
          url: req.url,
          method: req.method,
          headers: req.rawHeaders,
          address: `${res.socket?.remoteAddress}:${res.socket?.remotePort}`,
        })
      );
    })(request, {}, (e: Error | null, parsed: Serverless.Response) => {
      expect(e).toBe(null);
      expect(parsed.status).toBe(200);
      expect(parsed.statusMessage).toBe("OK");
      expect(parsed.headers).toEqual(
        expect.objectContaining({
          connection: "close",
          date: expect.any(String),
        })
      );

      expect(JSON.parse(decodeString(parsed.buffer))).toEqual(
        expect.objectContaining({
          url: "/my-awesome-url?some-param=1",
          method: request.method,
          headers: ["X-Custom-Header", "my-header", "Host", "127.0.0.1"],
          address: "192.168.1.1:5411",
        })
      );

      done();
    });
  });

  test("should return connection:close when specified", async () => {
    request.headers.Connection = "Close";

    await handler((_: http.IncomingMessage, res: http.ServerResponse) => {
      res.writeHead(200, "Status OK");
      res.end();
    })(request, {}, (e: Error | null, parsed: Serverless.Response) => {
      expect(e).toBe(null);
      expect(parsed).toEqual(
        expect.objectContaining({
          buffer: "",
          status: 200,
          statusMessage: "Status OK",
          headers: expect.objectContaining({
            connection: "close",
          }),
        })
      );
    });
  });

  test("should write headers", (done) => {
    handler((_: http.IncomingMessage, res: http.ServerResponse) => {
      // This should be ignored.
      res.setHeader("set-cookie", ["cookie1=value1", "cookie2=value2"]);
      res.setHeader("connection", "keep-alive");
      res.writeHead(200, "Status OK");
      res.end();
    })(request, {}, (e: Error | null, parsed: Serverless.Response) => {
      expect(e).toBe(null);
      expect(parsed).toEqual(
        expect.objectContaining({
          buffer: "",
          status: 200,
          statusMessage: "Status OK",
          headers: expect.objectContaining({
            "set-cookie": ["cookie1=value1", "cookie2=value2"],
            connection: "close",
          }),
        })
      );

      done();
    });
  });

  test("should write string responses", (done) => {
    handler((_: http.IncomingMessage, res: http.ServerResponse) => {
      res.write("Written a text\r\n\r\n");
      res.write("Write something else");
      res.end("my-data");
    })(request, {}, (e: Error | null, parsed: Serverless.Response) => {
      expect(e).toBe(null);
      expect(parsed).toEqual(
        expect.objectContaining({
          status: 200,
          statusMessage: "OK",
          headers: expect.objectContaining({
            date: expect.any(String),
            connection: "close",
          }),
        })
      );

      done();
    });
  });

  test("should handle transfer-encoding: chunked", (done) => {
    handler((_: http.IncomingMessage, res: http.ServerResponse) => {
      // This should be ignored
      res.setHeader("transfer-encoding", "chunked");
      res.write("Written a text\r\n\r\n");
      res.write("Write something else");
      res.end("my-data");
    })(request, {}, (e: Error | null, parsed: Serverless.Response) => {
      expect(e).toBe(null);
      expect(decodeString(parsed.buffer)).toEqual(
        "Written a text\r\n\r\nWrite something elsemy-data"
      );
      expect(parsed.headers?.["transfer-encoding"]).toBeUndefined();
      expect(parsed).toEqual(
        expect.objectContaining({
          status: 200,
          statusMessage: "OK",
          headers: expect.objectContaining({
            date: expect.any(String),
            connection: "close",
          }),
        })
      );

      done();
    });
  });

  const mockJsFile = mockMainJs();

  test("should handle large responses", (done) => {
    handler((_: http.IncomingMessage, res: http.ServerResponse) => {
      res.end(mockJsFile);
    })(request, {}, (e: Error | null, parsed: Serverless.Response) => {
      expect(e).toBe(null);
      expect(decodeString(parsed.buffer)).toBe(mockJsFile);
      done();
    });
  });
});
