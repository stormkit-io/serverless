import http from "http";

export default (req: http.IncomingMessage, res: http.ServerResponse) => {
  res.setHeader("x-endpoint", "HEAD /");
  res.end();
};
