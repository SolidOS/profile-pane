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

        {
          test: /\.ttl$/, // Target text  files
          type: 'asset/source', // Load the file's content as a string
        },
  
      ],
    },
    resolve: {
      extensions: ["*", ".js", ".ts"]
    },

    devServer: {
      static: './dist'
    },
    devtool: "source-map",
  },
];
