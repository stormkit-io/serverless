import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import jsonResolve from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";

const inputs = {
  serverless: "./src/serverless.ts",
  presets: "./src/presets/presets.ts",
  router: "./src/router.ts",
  "dev-server": "./src/dev-server/dev-server.ts",
  "entries/nuxt-v2": "./src/entries/nuxt/server-v2.ts",
  "entries/next": "./src/entries/next/server.ts",
  "entries/default": "./src/entries/default/server.ts",
  "entries/angular": "./src/entries/angular/server.ts",
  "entries/api": "./src/entries/api/server.ts",
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
      serverless: "./dist/types/serverless.d.ts",
      presets: "./dist/types/presets/presets.d.ts",
      router: "./dist/types/router.d.ts",
      "dev-server": "./dist/types/dev-server/dev-server.d.ts",
    },
    output: {
      dir: "dist",
      format: "es",
    },
    plugins: [dts()],
  },
];
