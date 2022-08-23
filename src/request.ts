import type { Socket } from "net";
import http from "http";
import { Readable } from "stream";

export interface NodeRequest {
  url: string; // /relative/path?query=value#hash
  path: string; // /relative/path
  body: string;
  method: string;
  headers: Record<string, string>;
  remoteAddress?: string;
  remotePort?: string;
  context: {
    features?: Record<string, boolean>;
    apiKey?: string;
    envId?: string;
  };
}

class Request extends http.IncomingMessage {
  constructor(props: NodeRequest) {
    const socket = {
      readable: false,
      remoteAddress: props.remoteAddress,
      remotePort: Number(props.remotePort) || 0,
      destroy: Function.prototype,
      end: Function.prototype,
    } as Socket;

    super(socket);

    // Node.js < 13 support
    this.connection = socket;

    props.headers = props.headers || {};

    Object.assign(this, {
      url: props.url,
      complete: true,
      httpVersionMajor: "1",
      httpVersionMinor: "1",
      httpVersion: "1.1",
      method: props.method,
      headers: Object.keys(props.headers).reduce(
        (obj: Record<string, string>, key: string) => {
          obj[key.toLowerCase()] = props.headers[key];
          return obj;
        },
        {}
      ),
    });

    this.rawHeaders = Object.keys(props.headers).reduce(
      (array: string[], key: string) => {
        array.push(key);
        array.push(props.headers[key]);
        return array;
      },
      []
    );

    this.pipe = <T extends NodeJS.WritableStream>(destination: T): T => {
      const s = new Readable();
      s.push(props.body);
      s.push(null);
      s.pipe(destination);
      return destination;
    };
  }
}

export default Request;
