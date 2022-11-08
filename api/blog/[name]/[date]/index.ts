import http from "http";

export default (req: http.IncomingMessage, res: http.ServerResponse) => {
  res.end("endpoint: ALL /blog/:name/:date");
};
