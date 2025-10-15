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

    req
      .on("error", () => {
        done.fail("I shouldn't be called");
      })
      .on("data", (chunk) => {
        expect(chunk).toBe("Hello world");
        done();
      });
  });

  test("should allow accessing body directly", () => {
    const req = new Request({
      url: "/",
      path: "/",
      headers: {},
      method: "POST",
      body: "Hello world",
    });

    expect(req.body).toBe("Hello world");
  });

  test("should contain both method and httpMethod", () => {
    const req = new Request({
      url: "/",
      path: "/",
      headers: {},
      method: "POST",
      body: "Hello world",
    });

    expect(req.method).toBe("POST");
    expect(req.httpMethod).toBe("POST");
  });
});
