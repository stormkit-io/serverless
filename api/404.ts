import http from "http";

export default (req: http.IncomingMessage, res: http.ServerResponse) => {
  res.writeHead(404);
  res.end("The page is not found.");
};
