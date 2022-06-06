import type { Express } from "express";
import fs from "fs";
import path from "path";
import { match } from "node-match-path";
import Request from "./request";
import Response from "./response";

interface WalkFile {
  name: string;
  path: string;
  rel: string;
}

const walkTree = (directory: string, tree: string[] = []): WalkFile[] => {
  const results: WalkFile[] = [];

  for (const fileName of fs.readdirSync(directory)) {
    const filePath = path.join(directory, fileName);
    const fileStats = fs.statSync(filePath);

    if (fileStats.isDirectory()) {
      results.push(...walkTree(filePath, [...tree, fileName]));
    } else {
      results.push({
        name: fileName,
        path: directory,
        rel: path.join(...tree, fileName),
      });
    }
  }

  return results;
};

export const matchPath = (
  directory: string,
  requestPath: string
): WalkFile | undefined => {
  const files = walkTree(directory);

  for (const file of files) {
    // /users/[id]/index.js => /users/:id
    let normalized = file.rel.replace(/\[(.*)\]/g, ":$1");

    if (file.name.startsWith("index.")) {
      normalized = normalized.split(`${file.name}`)[0].replace(/\/+$/, "");
    } else {
      normalized = normalized.split(".")[0];
    }

    if (match(`/${normalized}`, requestPath).matches) {
      return file;
    }
  }
};

export const handleError = (callback: AwsCallback) => (e: Error) => {
  let msg = e && e.message ? e.message : undefined;
  let stack = e && e.stack ? e.stack : undefined;

  // In case it's a string
  if (e && !msg && typeof e === "string") {
    msg = e;
  }

  // Stringify it, if not yet stringified.
  if (typeof msg !== "string") {
    msg = JSON.stringify(e);
  }

  return callback(null, {
    status: 500,
    errorMessage: msg,
    errorStack: stack,
  });
};

export const handleSuccess = (
  app: App,
  event: NodeRequest
): Promise<NodeResponse> => {
  // Add support for express apps
  if (app.hasOwnProperty("handle")) {
    // @ts-ignore
    app = app.handle.bind(app) as Express;
  }

  return new Promise((resolve) => {
    const req = new Request(event);
    const res = new Response(req);

    res.on("sk-end", (data: NodeResponse) => {
      resolve(data);
    });

    app(req, res);
  });
};
