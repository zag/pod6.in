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

      // @podlite/* packages ship both lib/ (compiled) and src/ (originals).
      // Their sourcemaps reference ../src/*.ts; source-map-loader then tries to
      // parse those raw TS files as modules, which fails. Exclude @podlite and
      // podlite packages from source-map-loader to stop that lookup.
      const skipSourceMap = /[\\/]node_modules[\\/](?:@podlite[\\/][^\\/]+|podlite)[\\/]/
      const walk = (rules) => {
        for (const rule of rules) {
          if (!rule) continue
          if (Array.isArray(rule.use)) rule.use.forEach((u) => walk([u]))
          if (Array.isArray(rule.oneOf)) walk(rule.oneOf)
          const loader = rule.loader || (rule.use && rule.use.loader)
          if (typeof loader === 'string' && loader.includes('source-map-loader')) {
            const existing = rule.exclude
            rule.exclude = existing
              ? (Array.isArray(existing) ? [...existing, skipSourceMap] : [existing, skipSourceMap])
              : skipSourceMap
          }
        }
      }
      walk(webpackConfig.module.rules)

      // Suppress source-map warnings from node_modules
      webpackConfig.ignoreWarnings = [/Failed to parse source map/]

      return webpackConfig
    },
  },
}
