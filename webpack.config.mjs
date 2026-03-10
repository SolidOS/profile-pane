import path from 'path'
import { createRequire } from 'module'
import TerserPlugin from 'terser-webpack-plugin'
import CopyPlugin from 'copy-webpack-plugin'

const require = createRequire(import.meta.url)

const common = {
  entry: './src/index.ts',
  performance: {
    hints: false
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    fallback: {
      path: require.resolve('path-browserify')
    }
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
  plugins: [
    ...(common.plugins || []),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve('src/styles'),
          to: path.resolve('lib/styles'),
        },
      ],
    }),
  ],
  optimization: {
    minimize: false,
  }
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
  plugins: [
    ...(common.plugins || []),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve('src/styles'),
          to: path.resolve('lib/styles'),
        },
      ],
    }),
  ],
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
  }
}

export default [normalConfig, minConfig]