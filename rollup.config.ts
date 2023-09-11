import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import jsonResolve from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";

const inputs = {
  serverless: "./src/serverless.ts",
  router: "./src/router.ts",
};

export default [
  ...Object.keys(inputs).map((key) => ({
    input: { [key]: inputs[key] },
    output: {
      dir: "dist",
      format: "cjs",
      exports: "auto",
    },
    plugins: [typescript(), commonjs(), nodeResolve(), jsonResolve()],
  })),
  {
    input: {
      serverless: "./dist/types/src/serverless.d.ts",
      router: "./dist/types/src/router.d.ts",
    },
    output: {
      dir: "dist",
      format: "es",
    },
    plugins: [dts()],
  },
];
