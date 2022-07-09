export function load<T>(id: string): T {
  // This is used by the dev-server
  if (process.env.REPO_PATH) {
    process.chdir(process.env.REPO_PATH);
    module.paths.push(process.env.REPO_PATH + "/node_modules");
  }

  return typeof __non_webpack_require__ !== "undefined"
    ? (__non_webpack_require__(id) as NodeRequire)
    : require(id);
}
