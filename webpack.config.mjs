import glob from 'glob';
import path from 'path';

const entries = Object.fromEntries(
  glob.sync('./src/**/*.ts').map(file => [
    path.relative('./src', file).replace(/\.ts$/, ''),
    file
  ])
);

const commonConfig = {
  entry: entries,
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      $rdf: 'rdflib',
      rdflib: 'rdflib',
      SolidLogic: 'solid-logic',
      'solid-logic': 'solid-logic',
      UI: 'solid-ui',
      'solid-ui': 'solid-ui'
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
        test: /\.(css|ttl)$/i,
        use: [
          {
            loader: 'raw-loader',
          },
        ],
      },
    ],
  },
  // No externals: bundle all dependencies
};

export default [
  {
    ...commonConfig,
    mode: 'production',
    output: {
      path: path.resolve('./lib/esm'),
      filename: '[name].mjs',
      library: {
        type: 'module',
      },
      clean: true,
    },
    experiments: {
      outputModule: true,
    },
  },
  {
    ...commonConfig,
    mode: 'production',
    output: {
      path: path.resolve('./lib/cjs'),
      filename: '[name].js',
      library: {
        type: 'commonjs2',
      },
      clean: true,
    },
  }
];
