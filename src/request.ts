import type { Serverless } from "../types/global";
import { Socket } from "node:net";
import http from "node:http";
import { Readable } from "node:stream";
import { Logger } from "./utils/logger";

class Request extends http.IncomingMessage {
  logger?: Logger;
  httpMethod?: string;

  constructor(props: Serverless.RequestEvent) {
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

    props.headers = props.headers || {};

    Object.assign(this, {
      url: props.url,
      complete: true,
      httpVersionMajor: "1",
      httpVersionMinor: "1",
      httpVersion: "1.1",
      httpMethod: props.method,
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

const registerEmitters = (obj: any, props: Serverless.RequestEvent) => {
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
