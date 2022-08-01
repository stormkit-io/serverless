export function load<T>(id: string): T {
  return typeof __non_webpack_require__ !== "undefined"
    ? (__non_webpack_require__(id) as NodeRequire)
    : require(id);
}
