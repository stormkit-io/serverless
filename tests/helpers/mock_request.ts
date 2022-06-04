import type { NodeRequest } from "~/types";
import type { ALBRequest } from "~/handlers/aws-alb";

export const mockNodeRequest = (): NodeRequest => ({
  method: "GET",
  headers: {
    "X-Custom-Header": "my-header",
    Host: "127.0.0.1",
  },
  url: "/my-awesome-url?some-param=1",
  body: "",
  remotePort: "5411",
  remoteAddress: "192.168.1.1",
});

export const mockALBRequest = (): ALBRequest => ({
  httpMethod: "GET",
  headers: {
    "X-Custom-Header": "my-header",
    Host: "127.0.0.1",
  },
  path: "/my-awesome-url",
  body: "",
  queryStringParameters: {
    "some-param": "1",
  },
  isBase64Encoded: false,
});
