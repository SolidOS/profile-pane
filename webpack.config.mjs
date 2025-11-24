import path from 'path'
import TerserPlugin from 'terser-webpack-plugin'

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
        test: /\.module\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
              importLoaders: 1,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.ttl$/i,
        type: 'asset/source'
      }
    ],
  },
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

const normalConfig = {
  ...common,
  mode: 'production',
  output: {
    path: path.resolve(process.cwd(), 'lib'),
    filename: 'profile-pane.js',
    library: {
      type: 'umd',
      name: 'ProfilePane',
      export: 'default',
    },
    globalObject: 'this',
    clean: true,
  },
  optimization: {
    minimize: false,
  },
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
}

export default [normalConfig, minConfig]