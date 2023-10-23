import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import jsonResolve from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";

const inputs = {
  router: "./src/router.ts",
  serverless: "./src/serverless.ts",
  middlewares: "./src/middlewares/index.ts",
  "middlewares/express": "./src/middlewares/express.ts",
  aws: "./src/handlers/aws.ts",
  gcp: "./src/handlers/gcp.ts",
  api: "./src/serverless-api.ts",
};

export default [
  ...Object.keys(inputs).map((key) =>
    defineConfig({
      input: { [key]: inputs[key] },
      external: ["vite"],
      output: {
        dir: "dist",
        format: "cjs",
        exports: "auto",
      },
      plugins: [typescript(), commonjs(), nodeResolve(), jsonResolve()],
    })
  ),
  {
    input: {
      router: "./dist/types/router.d.ts",
      serverless: "./dist/types/serverless.d.ts",
      middlewares: "./dist/types/middlewares/index.d.ts",
      "middlewares/express": "./dist/types/middlewares/express.d.ts",
      aws: "./dist/types/handlers/aws.d.ts",
      gcp: "./dist/types/handlers/gcp.d.ts",
      api: "./dist/types/serverless-api.d.ts",
    },
    output: {
      dir: "dist",
      format: "es",
    },
    plugins: [dts()],
  },
];
