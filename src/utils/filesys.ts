import fs from "fs";
import path from "path";
import { match } from "node-match-path";

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
