import type { ViewStyle } from 'react-native'

/**
 * The four offsets that used to come from `StyleSheet.absoluteFillObject`,
 * which React Native 0.86 (Expo SDK 57) dropped.
 *
 * `StyleSheet.absoluteFill` still exists and is the better choice inside a
 * style array; this one is for spreading into a `StyleSheet.create` entry,
 * which a registered style id cannot do.
 */
export const ABSOLUTE_FILL: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
}
