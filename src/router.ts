import path from "path";
import {
  matchPath as mp,
  walkTree,
  parseFileName,
  fileToRoute,
} from "./utils/filesys";

export const matchPath = (
  directory: string,
  requestPath: string,
  requestMethod: string
): string | undefined => {
  return mp(walkTree(directory), requestPath, requestMethod)?.rel;
};

interface GenerateRoutesOptions {
  serverSide: boolean;
}

export const generateRoutes = (
  directory: string,
  options?: GenerateRoutesOptions
): Record<string, string> => {
  const tree = walkTree(directory);
  const routes: Record<string, string> = {};

  tree.forEach((file) => {
    const route = fileToRoute(file.rel);
    const parsed = parseFileName(file.name);

    if (
      parsed.method === "all" ||
      parsed.method === "get" ||
      options?.serverSide === true
    ) {
      routes[route] = path.join("/", file.rel);
    }
  });

  return routes;
};
