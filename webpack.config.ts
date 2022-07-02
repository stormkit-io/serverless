import { Configuration, ModuleOptions, ResolveOptions } from "webpack";
import path from "path";

const resolve: ResolveOptions = {
  extensions: [".tsx", ".ts", ".js"],
  alias: {
    "~": path.join(__dirname, "src"),
  },
};

const module: ModuleOptions = {
  rules: [
    {
      test: /\.tsx?$/,
      use: "ts-loader",
      exclude: /node_modules/,
    },
  ],
};

const config: Configuration = {
  entry: {
    serverless: "./src/serverless.ts",
    "dev-server": "./src/dev-server/index.ts",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "commonjs",
  },
  mode: "production",
  target: "node",
  resolve,
  module,
  optimization: {
    minimize: false,
  },
};

const entries: Configuration = {
  entry: {
    "nuxt-v2": "./src/entries/nuxt/v2/server.ts",
    next: "./src/entries/next/server.ts",
    default: "./src/entries/default/server.ts",
    angular: "./src/entries/angular/server.ts",
  },
  output: {
    filename: "entries/[name].js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "commonjs",
  },
  mode: "production",
  target: "node",
  resolve,
  module,
  optimization: {
    minimize: false,
  },
};

export default [config, entries];
