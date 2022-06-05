import { Configuration } from "webpack";
import TerserPlugin from "terser-webpack-plugin";
import path from "path";

const config: Configuration = {
  entry: {
    index: "./src/index.ts",
    "dev-server": "./src/dev-server/index.ts",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "commonjs",
  },
  mode: "production",
  target: "node",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "~": path.join(__dirname, "src"),
    },
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
};

export default config;
