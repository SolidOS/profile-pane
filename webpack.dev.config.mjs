import HtmlWebpackPlugin from "html-webpack-plugin";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";
import webpack from "webpack";
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

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
        $rdf: 'rdflib'
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
          test: /\.(png|jpe?g|gif|webp|avif|svg)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.css$/,
          exclude: /\.module\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.module\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: true
              }
            }
          ]
        }
      ],
    },
    externals: {
      'rdflib': '$rdf',
      'solid-logic': 'SolidLogic',
      'solid-ui': 'UI'
    },
    resolve: {
      extensions: [".js", ".ts"],
      mainFiles: ['index.esm', 'index'],
      alias: {
        $rdf: 'rdflib',
        rdflib: 'rdflib',
        'solid-logic': resolve(__dirname, '../solid-logic/dist'),
        'solid-logic/': resolve(__dirname, '../solid-logic/dist/'),
        'solid-ui': resolve(__dirname, '../solid-ui/dist'),
        'solid-ui/': resolve(__dirname, '../solid-ui/dist/')
      }
    },
    output: {
      globalObject: 'globalThis',
      library: {
        type: 'umd',
        umdNamedDefine: true
      }
    },
    optimization: {
      usedExports: true,
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
      watchFiles: [
        './src/**/*',
        '../solid-ui/dist/**/*'
      ]
    },
    devtool: "source-map",
  },
];
