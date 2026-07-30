// Web-only stub for `react-native-maps` (and `react-native-map-clustering`).
// The real package imports native-only modules and cannot bundle for web, so
// metro.config.js substitutes THIS file for the web platform only. Native
// (Android/iOS) builds use the real package and are unaffected. Not type-checked
// — tsc always sees the real react-native-maps types.
const React = require('react')
const { View, Text } = require('react-native')

// One-line: placeholder MapView so web screens render an empty map box, not crash.
function MapStub(props) {
  return React.createElement(
    View,
    {
      style: [
        { alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9e9e9', minHeight: 120 },
        props && props.style,
      ],
    },
    React.createElement(Text, { style: { color: '#888', fontSize: 12 } }, 'Map (web preview stub)'),
    props && props.children,
  )
}

// One-line: no-op for overlay children (Marker, Circle, …) on web.
const Noop = () => null

module.exports = MapStub
module.exports.default = MapStub
module.exports.__esModule = true
module.exports.Marker = Noop
module.exports.Circle = Noop
module.exports.Callout = Noop
module.exports.Polygon = Noop
module.exports.Polyline = Noop
module.exports.Overlay = Noop
module.exports.PROVIDER_GOOGLE = 'google'
module.exports.PROVIDER_DEFAULT = undefined
