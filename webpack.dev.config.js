const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = [
  {
    mode: "development",
    entry: ["./dev/index.ts"],
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "dev.bundle.js",
    },
    plugins: [
      new NodePolyfillPlugin(),
      new HtmlWebpackPlugin({ template: "./dev/index.html" }),
    ],
    module: {
      rules: [
        {
          test: /\.(js|ts)$/,
          exclude: /node_modules/,
          use: ["babel-loader"],
        },
      ],
    },
    resolve: {
      extensions: ["*", ".js", ".ts"],
    },
    devServer: {
      static: {
        directory: path.join(__dirname, "dist"),
      },
    },
    devtool: "source-map",
  },
];
