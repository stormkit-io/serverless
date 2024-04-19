import stream from "node:stream";

const originalConsole = console;
const originalStdout = process.stdout.write;
const originalStderr = process.stderr.write;

export interface Log {
  level: "info" | "error";
  msg: string;
  ts: number;
}

export class Logger {
  stdout: Log[] = [];

  constructor() {
    const stdout = this.streamWithContext("info");
    const stderr = this.streamWithContext("error");

    // @ts-ignore
    process.stdout.write = stdout.write.bind(stdout);
    // @ts-ignore
    process.stderr.write = stderr.write.bind(stdout);

    console = new console.Console(
      this.streamWithContext("info"),
      this.streamWithContext("error")
    );
  }

  streamWithContext(level: "info" | "error") {
    return new stream.Writable({
      write: (
        chunk: any,
        _: BufferEncoding,
        callback: (error?: Error | null) => void
      ): void => {
        this.stdout.push({
          ts: Date.now(),
          msg: chunk.toString(),
          level,
        });

        callback(null);
      },
    });
  }

  logs(): Log[] {
    this.restore();
    return this.stdout;
  }

  restore() {
    console = originalConsole;
    process.stdout.write = originalStdout;
    process.stderr.write = originalStderr;
  }
}
