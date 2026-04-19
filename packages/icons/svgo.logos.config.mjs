export default {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          // Logos can rely on ids for gradients/filters; preserve them.
          cleanupIds: false,
          // Brand assets must keep exact color values.
          convertColors: false
        }
      }
    }
  ]
}
