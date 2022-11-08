import path from "path";
import { generateRoutes } from "~/router";

describe("~/router", () => {
  const apiFolder = path.join(__dirname, "../../api");

  test("#generateRoutes - clientSide", () => {
    expect(generateRoutes(apiFolder)).toMatchSnapshot();
  });

  test("#generateRoutes - serverSide", () => {
    expect(generateRoutes(apiFolder, { serverSide: true })).toMatchSnapshot();
  });
});
