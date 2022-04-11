const HtmlWebpackPlugin = require("html-webpack-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = [
  {
    mode: "development",
    entry: ["./dev/index.ts"],
    plugins: [
      new HtmlWebpackPlugin({ template: "./dev/index.html" }),
      new NodePolyfillPlugin()
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
      fallback: { "path": require.resolve("path-browserify") }
    },

    devServer: {
      static: './dist'
    },
    devtool: "source-map",
  },
];
