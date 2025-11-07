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
    externals: {
      'solid-ui': 'UI',
      'solid-logic': 'SolidLogic',
      rdflib: '$rdf',
    },
    resolve: {
      extensions: ["*", ".js", ".ts"]
    },
    devServer: {
      static: ['./dev',
        {
          directory: './node_modules',
          publicPath: '/node_modules'
        }
      ]
    },
    devtool: "source-map",
  },
];
