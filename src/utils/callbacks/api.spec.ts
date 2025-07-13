import * as http from "node:http";
import { handleApi } from "./api";

jest.mock("~/utils/filesys", () => ({
  walkTree: () => {
    return [];
  },
  matchPath: () => {
    return { path: "/path/to/", name: "api-file.ts" };
  },
}));

const originalDateNow = Date.now;
const ts = 1487076708000;

describe("utils/callback/api.ts", () => {
  beforeEach(() => {
    Date.now = jest.fn(() => ts); //14.02.2017
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  describe("handleApi", () => {
    const exampleRequest = {
      method: "GET",
      url: "/",
      path: "/",
      body: "",
      headers: {},
      captureLogs: true,
    };

    afterEach(() => {
      jest.resetModules();
    });

    describe("with returned object", () => {
      beforeEach(() => {
        jest.mock(
          "./path/to/api-file.ts",
          () => () => {
            console.info("this is an info");
            console.log("this info log should be captured");
            console.info("this is another info");
            console.error("this error log should be captured");
            process.stdout.write("this comes from process.stdout.write");

            return {
              body: "Hello world",
              status: 201,
              headers: {
                "X-Custom-Header": "Sample Project",
              },
            };
          },
          { virtual: true }
        );
      });

      test("should handle returning a response body", async () => {
        const response = await handleApi(exampleRequest, "/");

        expect(response).toEqual({
          body: "Hello world",
          status: 201,
          logs: [
            { ts, msg: "this is an info\n", level: "info" },
            { ts, msg: "this info log should be captured\n", level: "info" },
            { ts, msg: "this is another info\n", level: "info" },
            { ts, msg: "this error log should be captured\n", level: "error" },
            { ts, msg: "this comes from process.stdout.write", level: "info" },
          ],
          headers: {
            "X-Custom-Header": "Sample Project",
          },
        });
      });
    });

    describe("with response.end", () => {
      beforeEach(() => {
        jest.mock(
          "./path/to/api-file.ts",
          () => (_: http.IncomingMessage, res: http.ServerResponse) => {
            console.log("captured logs");
            res.setHeader("X-Custom-Header", "Sample Project");
            res.write("Hi world");
            res.end();
          },
          { virtual: true }
        );
      });

      test("should handle returning a response body", async () => {
        const response = await handleApi(exampleRequest, "/");

        expect(response).toEqual({
          buffer: "SGkgd29ybGQ=",
          status: 200,
          statusMessage: "OK",
          logs: [{ ts, msg: "captured logs\n", level: "info" }],
          headers: {
            connection: "close",
            date: expect.any(String),
            "x-custom-header": "Sample Project",
          },
        });
      });
    });

    describe("commonjs", () => {
      beforeEach(() => {
        jest.mock(
          "./path/to/api-file.ts",
          () => ({
            default: (_: http.IncomingMessage, res: http.ServerResponse) => {
              console.log("captured logs");
              res.setHeader("X-Custom-Header", "Sample Project");
              res.write("Hi world");
              res.end();
            },
          }),
          { virtual: true }
        );
      });

      test("should handle returning a response body", async () => {
        const response = await handleApi(exampleRequest, "/");

        expect(response).toEqual({
          buffer: "SGkgd29ybGQ=",
          status: 200,
          statusMessage: "OK",
          logs: [{ ts, msg: "captured logs\n", level: "info" }],
          headers: {
            connection: "close",
            date: expect.any(String),
            "x-custom-header": "Sample Project",
          },
        });
      });
    });
  });
});
