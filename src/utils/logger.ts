import stream from "node:stream";

const stdout: string[] = [];
const originalConsole = console;
const originalStdout = process.stdout.write;
const originalStderr = process.stderr.write;

class Stdout extends stream.Writable {
  _write(
    chunk: any,
    _: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    stdout.push(chunk.toString());
    callback(null);
  }
}

export class Logger {
  constructor() {
    const stream = new Stdout();

    // @ts-ignore;
    process.stdout.write = process.stderr.write = stream.write.bind(stream);
    console = new console.Console(new Stdout(), new Stdout());
  }

  logs(): string {
    this.restore();
    return stdout.join("");
  }

  restore() {
    console = originalConsole;
    process.stdout.write = originalStdout;
    process.stderr.write = originalStderr;
  }
}
