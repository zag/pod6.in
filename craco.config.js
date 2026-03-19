module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Keep symlinks: false for portal resolutions
      webpackConfig.resolve.symlinks = false

      // Fix ESM modules that import 'react/jsx-runtime' without extension
      // (needed for @uiw/react-codemirror and other CM6 packages)
      webpackConfig.resolve.fullySpecified = false
      if (!webpackConfig.module.rules) webpackConfig.module.rules = []
      webpackConfig.module.rules.push({
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      })

      // Suppress source-map warnings from node_modules
      webpackConfig.ignoreWarnings = [/Failed to parse source map/]

      return webpackConfig
    },
  },
}
