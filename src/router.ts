import type { Method } from "./utils/filesys";
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

interface Route {
  path: string;
  file: string;
  method?: Method;
}

export const generateRoutes = (
  directory: string,
  options?: GenerateRoutesOptions
): Route[] => {
  const tree = walkTree(directory);
  const routes: Route[] = [];

  tree.forEach((file) => {
    const route = fileToRoute(file.rel);
    const parsed = parseFileName(file.name);

    if (
      parsed.method === "all" ||
      parsed.method === "get" ||
      options?.serverSide === true
    ) {
      const r: Route = {
        file: path.join("/", file.rel),
        path: route,
      };

      if (options?.serverSide === true) {
        r.method = parsed.method;
      }

      routes.push(r);
    }
  });

  return routes;
};
