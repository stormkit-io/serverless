import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import jsonResolve from "@rollup/plugin-json";

const inputs: Record<string, string> = {
  router: "./src/router.ts",
  serverless: "./src/serverless.ts",
  middlewares: "./src/middlewares/index.ts",
  "middlewares/express": "./src/middlewares/express.ts",
  aws: "./src/handlers/aws.ts",
  api: "./src/serverless-api.ts",
};

export default [
  ...Object.keys(inputs).map((key) =>
    defineConfig({
      input: inputs[key],
      external: ["vite"],
      output: [
        {
          file: `dist/${key}.js`,
          format: "cjs",
          exports: "auto",
          inlineDynamicImports: true,
        },
        {
          inlineDynamicImports: true,
          file: `dist/${key}.mjs`,
          format: "esm",
        },
      ],
      plugins: [typescript(), commonjs(), nodeResolve(), jsonResolve()],
    })
  ),
];
