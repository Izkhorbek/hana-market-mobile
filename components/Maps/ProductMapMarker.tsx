import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Marker } from 'react-native-maps'
import type { MarkerData } from './GoogleMap'
import LocationPinIcon from './LocationPinIcon'

interface ProductMapMarkerProps {
  marker: MarkerData
  color: string
  onPress: (marker: MarkerData) => void
}

/**
 * Isolated, memoized product marker.
 *
 * Two perf fixes vs. the previous inline `<Marker>` (see
 * docs/google-map-performance-audit.md):
 *
 *  1. `tracksViewChanges` is `true` only long enough to rasterize the SVG pin
 *     once, then flipped to `false`. Leaving it `true` (the old default) made
 *     react-native-maps re-capture the marker bitmap on every view change —
 *     the primary cause of the Android flicker and frame drops. The capture is
 *     re-armed if `color` changes (e.g. light/dark theme toggle) so the pin
 *     still updates, then settles back to `false`.
 *
 *  2. `React.memo` keeps the marker from re-rendering when the parent map
 *     re-renders (pan, modal open/close, theme), as long as its props are
 *     stable. The map passes a stable `marker` reference (memoized list), a
 *     stable `color`, and a ref-based stable `onPress`.
 */
const CAPTURE_SETTLE_MS = 500

const ProductMapMarker = ({ marker, color, onPress }: ProductMapMarkerProps) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true)

  // Allow one capture (and a re-capture whenever the pin color changes), then
  // stop the continuous re-rasterization that causes the blink.
  useEffect(() => {
    setTracksViewChanges(true)
    const id = setTimeout(() => setTracksViewChanges(false), CAPTURE_SETTLE_MS)
    return () => clearTimeout(id)
  }, [color])

  return (
    <Marker
      coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
      title={marker.title}
      onPress={() => onPress(marker)}
      // Bottom-center of the icon sits on the coordinate point. Without this
      // Android defaults to center-center, misplacing the pin.
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracksViewChanges}
    >
      <View style={styles.markerContainer}>
        <LocationPinIcon size={40} color={color} />
      </View>
    </Marker>
  )
}

const styles = StyleSheet.create({
  markerContainer: {
    // Explicit dimensions prevent Android from capturing the SVG at the wrong
    // size when creating the marker bitmap. Values match LocationPinIcon size=40.
    width: 31,
    height: 40,
    alignItems: 'center',
  },
})

export default React.memo(ProductMapMarker)
