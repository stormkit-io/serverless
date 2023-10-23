import type { RequestEvent } from "~/request";
import type { ServerlessResponse } from "~/response";
import * as gcp from "@google-cloud/functions-framework";
import serverless from "./serverless-api";
import { mockRequestEvent } from "~/utils/testing";

jest.mock("node:fs", () => ({
  readdirSync: () => {
    return [];
  },
}));

jest.mock("@google-cloud/functions-framework", () => ({
  http: jest.fn(),
}));

describe("serverless-api.ts", () => {
  let request: RequestEvent;

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
          (error: Error | null, data: ServerlessResponse) => {
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
      process.env.GOOGLE_FUNCTION_TARGET = "http";
    });

    afterEach(() => {
      delete process.env.GOOGLE_FUNCTION_TARGET;
    });

    test("should handle api request", () => {
      expect(serverless("/path/to/api/functions")).toBeUndefined();
      expect(gcp.http).toHaveBeenCalledWith("serverless", expect.any(Function));
    });
  });
});
