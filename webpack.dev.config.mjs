import HtmlWebpackPlugin from "html-webpack-plugin";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";
import webpack from "webpack";

export default [
  {
    mode: "development",
    entry: ["./dev/index.ts"],
    plugins: [
      new HtmlWebpackPlugin({ 
        template: "./dev/index.html",
        inject: 'head'
      }),
      new NodePolyfillPlugin(),
      new webpack.ProvidePlugin({
        $rdf: 'rdflib',
        SolidLogic: 'solid-logic',
        UI: 'solid-ui'
      }),
      new webpack.DefinePlugin({
        'global': 'globalThis',
        'process.env.NODE_ENV': JSON.stringify('development')
      })
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
        {
          test: /\.css$/,
          use: [
            {
              loader: 'raw-loader',
            },
          ],
        },
      ],
    },
    externals: {
      'fs': 'null',
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
    output: {
      filename: 'bundle.js',
      globalObject: 'globalThis',
      library: {
        type: 'umd',
        umdNamedDefine: true
      }
    },
    optimization: {
      usedExports: true,
      sideEffects: false,
      // Tree shaking in development (normally disabled for faster builds)
      providedExports: true,
    },
    devServer: {
      static: [
        './dev',
        {
          directory: './node_modules',
          publicPath: '/node_modules'
        }
      ],
    },
    devtool: "source-map",
  },
];
