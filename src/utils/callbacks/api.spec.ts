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

describe("utils/callback/api.ts", () => {
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
          "/path/to/api-file.ts",
          () => ({
            default: () => {
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
          }),
          { virtual: true }
        );
      });

      test("should handle returning a response body", async () => {
        const response = await handleApi(exampleRequest, "/");

        const expectedLogs =
          "stdout:this is an info\n" +
          "stdout:this info log should be captured\n" +
          "stdout:this is another info\n" +
          "stderr:this error log should be captured\n" +
          "stdout:this comes from process.stdout.write";

        expect(response).toEqual({
          body: "Hello world",
          status: 201,
          logs: expectedLogs,
          headers: {
            "X-Custom-Header": "Sample Project",
          },
        });
      });
    });

    describe("with response.end", () => {
      beforeEach(() => {
        jest.mock(
          "/path/to/api-file.ts",
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
          logs: "stdout:captured logs\n",
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
