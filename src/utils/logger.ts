import stream from "node:stream";

const originalConsole = console;
const originalStdout = process.stdout.write;
const originalStderr = process.stderr.write;

export class Logger {
  stdout: string[] = [];

  constructor() {
    const s = this.streamWithContext();

    // @ts-ignore;
    process.stdout.write = process.stderr.write = s.write.bind(s);

    console = new console.Console(
      this.streamWithContext(),
      this.streamWithContext()
    );
  }

  streamWithContext() {
    return new stream.Writable({
      write: (
        chunk: any,
        _: BufferEncoding,
        callback: (error?: Error | null) => void
      ): void => {
        this.stdout.push(chunk.toString());
        callback(null);
      },
    });
  }

  logs(): string {
    this.restore();
    return this.stdout.join("");
  }

  restore() {
    console = originalConsole;
    process.stdout.write = originalStdout;
    process.stderr.write = originalStderr;
  }
}
