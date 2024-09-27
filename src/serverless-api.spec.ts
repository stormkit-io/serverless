import type { Serverless } from "../types/global";
import * as gcp from "@google-cloud/functions-framework";
import serverless from "./serverless-api";
import { mockRequestEvent } from "./utils/testing";

jest.mock("node:fs", () => ({
  readdirSync: () => {
    return [];
  },
}));

jest.mock("@google-cloud/functions-framework", () => ({
  http: jest.fn(),
}));

describe("serverless-api.ts", () => {
  let request: Serverless.RequestEvent;

  beforeEach(() => {
    request = mockRequestEvent();
  });

  describe("aws", () => {
    beforeEach(() => {
      process.env.AWS_LAMBDA_FUNCTION_NAME = "myFunction";
    });

    afterEach(() => {
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    });

    test("should handle api request", () => {
      return new Promise((resolve) => {
        serverless("/path/to/api/functions")(
          request,
          {},
          (error: Error | null, data: Serverless.Response) => {
            expect(error).toBe(null);
            expect(data).toMatchObject({
              status: 404,
              statusMessage: "Not found",
            });

            resolve(true);
          }
        );
      });
    });
  });

  describe("gcp", () => {
    beforeEach(() => {
      process.env.FUNCTION_SIGNATURE_TYPE = "cloudevent";
      process.env.FUNCTION_TARGET = "myTarget";
    });

    afterEach(() => {
      delete process.env.FUNCTION_SIGNATURE_TYPE;
      delete process.env.FUNCTION_TARGET;
    });

    test("should handle api request", () => {
      serverless("/path/to/api/folder");
      expect(gcp.http).toHaveBeenCalledWith("myTarget", expect.any(Function));
    });
  });
});
