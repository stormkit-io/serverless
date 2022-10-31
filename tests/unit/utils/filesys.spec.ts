import path from "path";
import { matchPath } from "~/utils/filesys";

describe("utils/filesys", () => {
  test.each`
    file                             | requestPath               | requestMethod | match
    ${"/users/[id]/index.get.js"}    | ${"/users/15"}            | ${"GET"}      | ${true}
    ${"/users/[id]/index.get.js"}    | ${"/users/15"}            | ${"POST"}     | ${false}
    ${"/users/[id]/index.post.js"}   | ${"/users/15"}            | ${"POST"}     | ${true}
    ${"/users/[id]/[date]/index.js"} | ${"/users/2022-09-20/15"} | ${"POST"}     | ${true}
    ${"/users.js"}                   | ${"/users/15"}            | ${"GET"}      | ${false}
    ${"/users.js"}                   | ${"/users"}               | ${"GET"}      | ${true}
    ${"/users.js"}                   | ${"/users"}               | ${"POST"}     | ${true}
    ${"/users.head.js"}              | ${"/users"}               | ${"HEAD"}     | ${true}
    ${"/users.head.js"}              | ${"/users"}               | ${"POST"}     | ${false}
    ${"/index.js"}                   | ${"/users"}               | ${"POST"}     | ${false}
    ${"/index.js"}                   | ${"/"}                    | ${"POST"}     | ${true}
    ${"/index.js"}                   | ${"/"}                    | ${"PUT"}      | ${true}
    ${"/[id].put.js"}                | ${"/15"}                  | ${"PUT"}      | ${true}
    ${"/[id].put.js"}                | ${"/15"}                  | ${"POST"}     | ${false}
  `("should match the $file", ({ file, requestPath, requestMethod, match }) => {
    const fileName = path.basename(file);
    const walkFile = {
      name: fileName,
      rel: file,
      path: path.join(`/path/to/dir`, file),
    };

    expect(matchPath([walkFile], requestPath, requestMethod)).toBe(
      match ? walkFile : undefined
    );
  });
});
