import { Socket } from "node:net";
import http from "node:http";
import { Readable } from "node:stream";
import { Logger } from "./utils/logger";

export interface RequestEvent {
  url: string; // /relative/path?query=value#hash
  path: string; // /relative/path
  body: string;
  method: string;
  headers: http.IncomingHttpHeaders;
  remoteAddress?: string;
  remotePort?: string;
  captureLogs?: boolean;
}

class Request extends http.IncomingMessage {
  logger?: Logger;

  constructor(props: RequestEvent) {
    const socket = {
      readable: false,
      destroyed: false,
      remoteAddress: props.remoteAddress,
      remotePort: Number(props.remotePort) || 0,
      resume: Function.prototype,
      destroy: Function.prototype,
      end: Function.prototype,
    } as Socket;

    super(socket);

    if (props.captureLogs) {
      this.logger = new Logger();
    }

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
          const value = props.headers[key];

          if (Array.isArray(value)) {
            obj[key.toLowerCase()] = value.join(",");
          } else if (typeof value === "string" && value) {
            obj[key.toLowerCase()] = value;
          }

          return obj;
        },
        {}
      ),
    });

    this.rawHeaders = Object.keys(props.headers).reduce(
      (array: string[], key: string) => {
        const value = props.headers[key];

        if (Array.isArray(value)) {
          value.forEach((v) => {
            array.push(key, v);
          });
        } else if (value) {
          array.push(key, value);
        }

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

    registerEmitters(this, props);
  }
}

const registerEmitters = (obj: any, props: RequestEvent) => {
  const originalListener = obj.on;

  obj.on = (...args: any) => {
    const event: string = args.shift();
    const listener: (args?: any) => void = args.shift();

    if (event === "data") {
      listener(props.body);
    } else if (event === "end") {
      listener();
    } else if (event && listener) {
      originalListener.bind(obj, event, listener, ...args);
    }

    return obj;
  };
};

export default Request;
