import path from 'path'
import TerserPlugin from 'terser-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

const common = {
  entry: './src/index.ts',
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.ttl$/i,
        type: 'asset/source'
      }
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: 'profile-pane.css' }),
  ],
  externals: {
    'fs': 'null',
    'node-fetch': 'fetch',
    'isomorphic-fetch': 'fetch',
    'text-encoding': 'TextEncoder',
    '@trust/webcrypto': 'crypto',
    'rdflib': 'rdflib',
    'solid-logic': 'SolidLogic',
    'solid-ui': 'UI'
  },
  devtool: 'source-map',
}


const minConfig = {
  ...common,
  mode: 'production',
  output: {
    path: path.resolve(process.cwd(), 'lib'),
    filename: 'profile-pane.min.js',
    library: {
      type: 'umd',
      name: 'ProfilePane',
      export: 'default',
    },
    globalObject: 'this',
    clean: false,
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
        },
        extractComments: false,
      })
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: 'profile-pane.min.css' }),
  ],
}

export default [minConfig]