import HtmlWebpackPlugin from "html-webpack-plugin";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";

export default [
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
      extensions: [".js", ".ts"],
      alias: {
        $rdf: 'rdflib',
        rdflib: 'rdflib',
        SolidLogic: 'solid-logic',
        'solid-logic': 'solid-logic',
        UI: 'solid-ui',
        'solid-ui': 'solid-ui'
      }
    },
    devServer: {
      static: './dev',
    },
    devtool: "source-map",
  },
];
