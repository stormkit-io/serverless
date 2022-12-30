import Request from "./request";

describe("request.ts", () => {
  test("should emit data events", (done) => {
    const req = new Request({
      url: "/",
      path: "/",
      headers: {},
      method: "POST",
      body: "Hello world",
    });

    req.on("data", (chunk) => {
      expect(chunk).toBe("Hello world");
      done();
    });
  });
});
