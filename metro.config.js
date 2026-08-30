const { getSentryExpoConfig } = require('@sentry/react-native/metro')
const path = require('path')

const config = getSentryExpoConfig(__dirname)

// Web-only: `react-native-maps` imports native-only modules and cannot bundle
// for web. Alias it (and `react-native-map-clustering`, which wraps it) to a
// stub so the web preview builds. Native (Android/iOS) resolution is untouched.
const mapsStub = path.resolve(__dirname, 'stubs/reactNativeMapsWeb.js')
const previousResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    (moduleName === 'react-native-maps' ||
      moduleName === 'react-native-map-clustering')
  ) {
    return { type: 'sourceFile', filePath: mapsStub }
  }
  return previousResolveRequest
    ? previousResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform)
}

module.exports = config
