import fs from "fs";
import path from "path";
import { match } from "node-match-path";

export interface WalkFile {
  name: string; // file name
  path: string; // absolute path to the directory
  rel: string; // relative path including file name
}

export const walkTree = (
  directory: string,
  tree: string[] = []
): WalkFile[] => {
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

type Method = "get" | "post" | "patch" | "put" | "delete" | "head" | "all";

const parseFileName = (fileName: string): { name: string; method: Method } => {
  const pieces = fileName.split(".");

  if (pieces.length <= 2) {
    return { name: pieces[0], method: "all" };
  }

  return {
    name: pieces[0],
    method: pieces[pieces.length - 2].toLowerCase() as Method,
  };
};

export const matchPath = (
  files: WalkFile[],
  requestPath: string,
  requestMethod: string = "get"
): WalkFile | undefined => {
  const method = requestMethod.toLowerCase();

  for (const file of files) {
    // /users/[id]/index.js => /users/:id
    let normalized = file.rel.replace(/\[(.*)\]/g, ":$1");

    const parsed = parseFileName(file.name);

    // /users/[id]/index.get.js => /users/:id (if method matches)
    if (parsed.method !== "all" && parsed.method !== method) {
      return;
    }

    if (parsed.name === "index") {
      normalized = path.dirname(normalized);
    } else {
      normalized = normalized.split(".")[0];
    }

    if (match(path.join("/", normalized), requestPath).matches) {
      return file;
    }
  }
};
