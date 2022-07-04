import fs from "fs";
import path from "path";
import http from "http";
import serverless from "../../serverless";
import { load } from "../../utils";

interface NextServerOpts {
  dev: boolean;
  customServer: boolean;
  minimalMode: boolean;
  dir: string;
  conf: Record<string, any>;
}

function findProjectRoot(dir: string): string {
  let i = 0;

  while (!fs.existsSync(path.join(dir, ".next")) && i++ < 10) {
    dir = path.dirname(dir);

    if (dir === "/") {
      return __dirname;
    }
  }

  return dir;
}

const requiredFiles: Record<string, any> = {};
const root = findProjectRoot(__dirname);

try {
  Object.assign(
    requiredFiles,
    JSON.parse(
      fs
        .readFileSync(path.join(root, ".next/required-server-files.json"))
        .toString("utf-8")
    )
  );
} catch {}

const serverConfig: NextServerOpts = {
  dev: false,
  dir: root,
  customServer: true,
  minimalMode: true,
  conf: {
    ...requiredFiles.config,
    outputFileTracing: false, // see https://github.com/vercel/next.js/issues/30484#issuecomment-955099966
    compress: false,
  },
};

// Backwards compatibility
if (fs.existsSync(path.join(root, ".next/serverless"))) {
  serverConfig.conf.target = "serverless";
}

const Next = load<{ default: any }>("next/dist/server/next-server").default;
const next = new Next(serverConfig);
const handler = next.getRequestHandler();

let ready = false;

export const renderer = serverless(
  async (
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> => {
    if (!ready) {
      await next.prepare();
      ready = true;
    }

    await handler(req, res);
  }
);
