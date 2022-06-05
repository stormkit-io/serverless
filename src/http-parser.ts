import { HTTPParser, HeaderInfo, HeaderObject } from "http-parser-js";
import http from "http";

interface ParsedMessage {
  buffer?: Buffer;
  headers: http.IncomingHttpHeaders;
  statusCode?: number;
  statusMessage?: string;
}

export default (buffer?: Buffer): ParsedMessage => {
  if (!buffer) {
    return { headers: {} };
  }

  const parser = new HTTPParser(HTTPParser.RESPONSE);
  const parsed: ParsedMessage = {
    headers: {},
  };

  // @ts-ignore
  parser.onHeadersComplete = (info: HeaderInfo<string[]>) => {
    parsed.statusCode = info.statusCode;
    parsed.statusMessage = info.statusMessage;

    while (info.headers.length > 0) {
      const key = info.headers.shift();
      const val = info.headers.shift();

      if (key && val) {
        const lowerKey = key.toLowerCase();

        if (Array.isArray(parsed.headers[lowerKey])) {
          (parsed.headers[lowerKey] as string[]).push(val);
        } else if (parsed.headers[lowerKey]) {
          parsed.headers[lowerKey] = [parsed.headers[lowerKey] as string, val];
        } else {
          parsed.headers[lowerKey] = val;
        }
      }
    }
  };

  const body: Uint8Array[] = [];

  parser.onBody = function (chunk: Buffer, offset: number, length: number) {
    body.push(chunk.slice(offset, offset + length));
  };

  parser.execute(buffer);
  parser.finish();
  parser.close();

  parsed.buffer = Buffer.concat(body);

  return parsed;
};
