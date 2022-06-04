import stream from "stream";
import Request from "./request";

interface BufferedChunk {
  chunk: any;
  encoding: BufferEncoding;
}

class ResponseStream extends stream.Writable {
  buffer: Buffer[] = [];

  _write(
    chunk: any,
    encoding: BufferEncoding,
    next: (error?: Error | null) => void
  ): void {
    this.buffer.push(Buffer.from(chunk, encoding));
    next();
  }

  _writev?(
    chunks: BufferedChunk[],
    next: (error?: Error | null) => void
  ): void {
    chunks.forEach((d) => {
      this.buffer.push(Buffer.from(d.chunk, d.encoding));
    });

    next();
  }

  _destroy(err: Error | null, callback: (error?: Error | null) => void): void {
    this.buffer = [];
    callback(err);
  }
}

export default (req: Request): ResponseStream => {
  const stream = new ResponseStream({ highWaterMark: Number.MAX_VALUE });

  Object.defineProperties(stream, {
    remoteFamily: { value: "IPv4" },
    remotePort: { value: req.socket.remotePort || req.connection?.remotePort },
    remoteAddress: {
      value: req.socket.remoteAddress || req.connection?.remoteAddress,
    },
  });

  return stream;
};
