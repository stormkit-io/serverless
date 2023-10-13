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
  const files = fs.readdirSync(directory);

  const dirs: string[] = [];

  for (const fileName of files) {
    const filePath = path.join(directory, fileName);
    const fileStats = fs.statSync(filePath);

    if (!fileStats.isDirectory()) {
      results.push({
        name: fileName,
        path: directory,
        rel: path.join(...tree, fileName),
      });
    } else {
      dirs.push(fileName);
    }
  }

  for (const dirName of dirs) {
    const filePath = path.join(directory, dirName);
    results.push(...walkTree(filePath, [...tree, dirName]));
  }

  return results;
};

export type Method =
  | "get"
  | "post"
  | "patch"
  | "put"
  | "delete"
  | "head"
  | "options"
  | "all";

export const parseFileName = (
  fileName: string
): { name: string; method: Method } => {
  const pieces = fileName.split(".");

  if (pieces.length <= 2) {
    return { name: pieces[0], method: "all" };
  }

  return {
    name: pieces[0],
    method: pieces[pieces.length - 2].toLowerCase() as Method,
  };
};

// /users/[id]/index.js => /users/:id
export const fileToRoute = (file: string): string => {
  const fileName = file.split(path.sep).pop()?.split(".")[0];
  let normalized = file.replace(/\[([a-zA-Z0-9_\.:-]*)\]/g, ":$1");

  if (fileName === "index") {
    normalized = path.dirname(normalized);
  } else {
    normalized = normalized.split(".")[0];
  }

  return path.join(path.sep, normalized);
};

export const matchPath = (
  files: WalkFile[],
  requestPath: string,
  requestMethod: string = "get"
): WalkFile | undefined => {
  const method = requestMethod.toLowerCase();

  for (const file of files) {
    const parsed = parseFileName(file.name);

    if (file.name.startsWith("_") || file.rel.indexOf(`${path.sep}_`) > -1) {
      continue;
    }

    if (file.name.includes(".spec.")) {
      continue;
    }

    // /users/[id]/index.get.js => /users/:id (if method matches)
    if (parsed.method !== "all" && parsed.method !== method) {
      continue;
    }

    const route = fileToRoute(file.rel);

    if (match(route, requestPath).matches) {
      return file;
    }
  }
};
