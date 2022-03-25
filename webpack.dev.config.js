const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = [
  {
    mode: "development",
    entry: ["./dev/index.ts"],
    plugins: [
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
      static: './dist'
    },
    devtool: "source-map",
  },
];
