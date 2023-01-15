import path from "node:path";
import { matchPath } from "./filesys";

describe("utils/filesys.ts", () => {
  test.each`
    name               | dir                  | requestPath          | requestMethod | isMatch
    ${"index.js"}      | ${"/_users"}         | ${"/_users"}         | ${"GET"}      | ${false}
    ${"_index.js"}     | ${"/users"}          | ${"/users/_index"}   | ${"GET"}      | ${false}
    ${"index.js"}      | ${"/users"}          | ${"/users/index"}    | ${"GET"}      | ${false}
    ${"index.js"}      | ${"/users"}          | ${"/users"}          | ${"GET"}      | ${true}
    ${"index.post.js"} | ${"/users"}          | ${"/users"}          | ${"GET"}      | ${false}
    ${"index.post.js"} | ${"/users"}          | ${"/users"}          | ${"POST"}     | ${true}
    ${"me.js"}         | ${"/blog/about"}     | ${"/blog/about/me"}  | ${"POST"}     | ${true}
    ${"me.head.js"}    | ${"/blog/about"}     | ${"/blog/about/me"}  | ${"POST"}     | ${false}
    ${"index.js"}      | ${"/blog/_about/me"} | ${"/blog/_about/me"} | ${"POST"}     | ${false}
  `(
    "should match the correct path: $name, $dir, $requestMethod",
    ({ name, dir, requestPath, requestMethod, isMatch }) => {
      expect(
        Boolean(
          matchPath(
            [{ name: name, path: dir, rel: path.join(dir, name) }],
            requestPath,
            requestMethod
          )
        )
      ).toBe(isMatch);
    }
  );
});
