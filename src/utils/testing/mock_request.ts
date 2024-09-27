import type { Serverless } from "../../../types/global";

export const mockRequestEvent = (): Serverless.RequestEvent => ({
  method: "GET",
  headers: {
    "X-Custom-Header": "my-header",
    Host: "127.0.0.1",
  },
  url: "/my-awesome-url?some-param=1",
  path: "/my-awesome-url",
  body: "",
  remotePort: "5411",
  remoteAddress: "192.168.1.1",
});
