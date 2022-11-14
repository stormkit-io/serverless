import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import jsonResolve from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";

const inputs = {
  serverless: "./src/serverless.ts",
  presets: "./src/presets/presets.ts",
  router: "./src/router.ts",
  datastore: "./src/storage/datastore.ts",
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
      serverless: "./dist/types/src/serverless.d.ts",
      presets: "./dist/types/src/presets/presets.d.ts",
      router: "./dist/types/src/router.d.ts",
      datastore: "./dist/types/src/storage/datastore.d.ts",
      "dev-server": "./dist/types/src/dev-server/dev-server.d.ts",
    },
    output: {
      dir: "dist",
      format: "es",
    },
    plugins: [dts()],
  },
];
