import type { Serverless } from "../types/global";
import serverless from "./serverless-api";
import { mockRequestEvent } from "./utils/testing";

jest.mock("node:fs", () => ({
  readdirSync: () => {
    return [];
  },
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
});
