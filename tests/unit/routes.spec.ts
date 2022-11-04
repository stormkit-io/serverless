import path from "path";
import { generateRoutes } from "~/router";

describe("~/router", () => {
  const apiFolder = path.join(__dirname, "../../api");

  test("#generateRoutes - clientSide", () => {
    expect(generateRoutes(apiFolder)).toEqual({
      "/404": "/404.ts",
      "/README": "/README.md",
      "/": "/index.ts",
    });
  });

  test("#generateRoutes - serverSide", () => {
    expect(generateRoutes(apiFolder, { serverSide: true })).toEqual({
      "/404": "/404.ts",
      "/README": "/README.md",
      "/": "/index.ts",
      "/user/:id": "/user/[id]/index.post.ts",
    });
  });
});
