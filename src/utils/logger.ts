import stream from "node:stream";

const originalConsole = console;
const originalStdout = process.stdout.write;
const originalStderr = process.stderr.write;

export class Logger {
  stdout: string[] = [];

  constructor() {
    const stdout = this.streamWithContext("stdout");
    const stderr = this.streamWithContext("stderr");

    // @ts-ignore
    process.stdout.write = stdout.write.bind(stdout);
    // @ts-ignore
    process.stderr.write = stderr.write.bind(stdout);

    console = new console.Console(
      this.streamWithContext("stdout"),
      this.streamWithContext("stderr")
    );
  }

  streamWithContext(level: "stderr" | "stdout") {
    return new stream.Writable({
      write: (
        chunk: any,
        _: BufferEncoding,
        callback: (error?: Error | null) => void
      ): void => {
        this.stdout.push(`${level}:${chunk.toString()}`);
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
