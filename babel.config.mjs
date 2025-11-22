export default {
  presets: [
      ['@babel/preset-env', {
          targets: {
            browsers: ['> 1%', 'last 3 versions', 'not dead']
          },
          modules: false
       }],
    '@babel/preset-typescript'
  ],
  plugins: [
    [
      'babel-plugin-inline-import', {
        extensions: [
          '.ttl'
        ]
      }
    ]
  ]
}