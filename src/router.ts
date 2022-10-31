import { matchPath as mp, walkTree } from "./utils/filesys";

export const matchPath = (
  directory: string,
  requestPath: string,
  requestMethod: string
): string | undefined => {
  return mp(walkTree(directory), requestPath, requestMethod)?.rel;
};
