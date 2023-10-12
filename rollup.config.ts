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
      router: "./dist/types/src/router.d.ts",
      serverless: "./dist/types/src/serverless.d.ts",
      middlewares: "./dist/types/src/middlewares/index.d.ts",
    },
    output: {
      dir: "dist",
      format: "es",
    },
    plugins: [dts()],
  },
];
