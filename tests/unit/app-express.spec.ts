import zlib from "zlib";
import http from "http";
import path from "path";
import compression from "compression";
import express, { Express } from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { createProxyMiddleware } from "http-proxy-middleware";
import { NodeRequest, NodeResponse } from "~/types";
import renderer from "~/handlers/stormkit";
import {
  mockNodeRequest,
  mockUploadData,
  mockMainJs,
  decodeString,
} from "../helpers";

describe("express", () => {
  let request: NodeRequest;
  let app: Express;

  describe("basic", () => {
    const mockJsFile = mockMainJs();

    beforeEach(() => {
      app = express();
      app.use(express.static(path.join(__dirname, "../helpers/mockdata")));
      app.use(cookieParser());
      app.use(fileUpload());
      app.disable("x-powered-by");

      request = mockNodeRequest();
      request.headers["cookie"] =
        "PHPSESSID=298zf09hf012fh2; csrftoken=u32t4o3tb3gg43; _gat=1";

      app.get("/my-route", (_: express.Request, res: express.Response) => {
        res.redirect("/my-new-route?query-string=1#hash");
      });

      app.get("*", (req: express.Request, res: express.Response) => {
        res.send(req.cookies.PHPSESSID);
      });
    });

    test("should receive a request to catch all route", async () => {
      await renderer(app)(
        request,
        {},
        (e: Error | null, parsed: NodeResponse) => {
          expect(e).toBe(null);

          expect(decodeString(parsed.buffer)).toBe("298zf09hf012fh2");

          expect(parsed.status).toBe(200);
          expect(parsed.statusMessage).toBe("OK");
          expect(parsed.headers).toEqual(
            expect.objectContaining({
              "content-length": "15",
              "content-type": "text/html; charset=utf-8",
              etag: expect.any(String),
            })
          );
        }
      );
    });

    test("should redirect properly", async () => {
      request.url = "/my-route";

      await renderer(app)(
        request,
        {},
        (e: Error | null, parsed: NodeResponse) => {
          expect(e).toBe(null);

          expect(decodeString(parsed.buffer)).toBe(
            "Found. Redirecting to /my-new-route?query-string=1#hash"
          );

          expect(parsed.status).toBe(302);
          expect(parsed.statusMessage).toBe("Found");
          expect(parsed.headers).toEqual(
            expect.objectContaining({
              location: "/my-new-route?query-string=1#hash",
              "content-length": "55",
              "content-type": "text/plain; charset=utf-8",
              date: expect.any(String),
            })
          );
        }
      );
    });

    test("should handle large responses", async () => {
      request.url = "/main_js.txt";

      try {
        await renderer(app)(
          request,
          {},
          (e: Error | null, parsed: NodeResponse) => {
            expect(e).toBe(null);
            expect(decodeString(parsed.buffer)).toBe(mockJsFile);
          }
        );
      } catch (e) {
        expect(e).toBe(null);
      }
    });
  });

  describe("file upload", () => {
    beforeEach(() => {
      app = express();
      app.use(cookieParser());
      app.use(fileUpload());
      app.disable("x-powered-by");

      request = mockNodeRequest();
      request.headers["cookie"] =
        "PHPSESSID=298zf09hf012fh2; csrftoken=u32t4o3tb3gg43; _gat=1";

      app.all("/upload", (req: express.Request, res: express.Response) => {
        let data: Buffer | undefined;

        if (Array.isArray(req?.files?.image)) {
          data = req?.files?.image[0].data;
        } else {
          data = req?.files?.image.data;
        }

        res.setHeader("content-type", "application/json; charset=utf-8");
        res.send(data?.toString("utf-8"));
      });
    });

    test("should upload a file", async () => {
      const mockData = mockUploadData();
      request.headers = mockData.headers;
      request.body = mockData.body;
      request.method = "POST";
      request.url = "http://127.0.0.1/upload";

      try {
        await renderer(app)(
          request,
          {},
          (e: Error | null, parsed: NodeResponse) => {
            expect(e).toBe(null);
            expect(parsed.headers).toEqual({
              "content-type": "application/json; charset=utf-8",
              "content-length": "1060",
              etag: expect.any(String),
              date: expect.any(String),
              connection: "close",
            });
            expect(JSON.parse(decodeString(parsed.buffer)).name).toBe(
              "@stormkit/serverless"
            );
          }
        );
      } catch (e) {
        expect(e).toBe(null);
      }
    });
  });

  describe("gzip", () => {
    const mockData = mockUploadData().body;

    beforeEach(() => {
      app = express();
      app.use(compression({ level: 1, filter: () => true }));
      app.disable("x-powered-by");
      request = mockNodeRequest();

      app.get("*", (_: express.Request, res: express.Response) => {
        res.send(mockData);
      });
    });

    test("should compress response", (done) => {
      request.headers["Accept-Encoding"] = "gzip, compress, br";

      renderer(app)(request, {}, (e: Error | null, parsed: NodeResponse) => {
        expect(e).toBe(null);
        expect(parsed.headers).toEqual(
          expect.objectContaining({
            "content-type": "text/html; charset=utf-8",
            "content-encoding": "gzip",
            connection: "close",
            vary: "Accept-Encoding",
          })
        );

        expect(
          zlib
            .gunzipSync(Buffer.from(parsed.buffer || "", "base64"))
            .toString("utf-8")
        ).toBe(mockData);

        done();
      });
    });
  });

  describe("http proxy", () => {
    const proxy = express();
    let server: http.Server;

    beforeEach(() => {
      request = mockNodeRequest();

      app = express();
      app.disable("x-powered-by");

      proxy.disable("x-powered-by");
      proxy.use(bodyParser.urlencoded({ extended: false }));

      proxy.all("*", (req, res) => {
        expect(req.body.post).toBe("15");
        expect(req.headers["x-forwarded-host"]).toBe("my-host:8080");
        expect(req.headers["x-forwarded-port"]).toBe("8080");
        expect(req.headers["x-forwarded-for"]).toBe("192.168.1.1");
        res.setHeader("x-custom-proxy-header", "1");
        res.send({ user: "robin", email: "robin@stormkit.io" });
      });

      server = proxy.listen(8200);

      app.use(
        "/api",
        createProxyMiddleware({
          logLevel: "silent",
          target: "http://localhost:8200",
          changeOrigin: true,
          xfwd: true,
          cookieDomainRewrite: ".localhost",
          pathRewrite: {
            "^/api": "",
          },
        })
      );
    });

    afterEach(() => {
      server.close();
    });

    test("should receive a request to catch all route", async () => {
      request.url = "http://localhost:8080/api";
      request.body = "post=15";
      request.method = "POST";
      request.headers["host"] = "my-host:8080";
      request.headers["content-type"] = "application/x-www-form-urlencoded";
      request.headers["content-length"] = request.body.length + "";

      await renderer(app)(
        request,
        {},
        (e: Error | null, parsed: NodeResponse) => {
          expect(e).toBe(null);
          expect(parsed.headers["x-custom-proxy-header"]).toBe("1");
          expect(JSON.parse(decodeString(parsed.buffer))).toEqual({
            user: "robin",
            email: "robin@stormkit.io",
          });
        }
      );
    });
  });
});
