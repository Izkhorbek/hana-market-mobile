import type { BottomTabBarButtonProps } from 'expo-router/build/react-navigation/bottom-tabs/types'
import { PlatformPressable } from 'expo-router/build/react-navigation/elements'
import * as Haptics from 'expo-haptics'

// Both imports are deep on purpose. expo-router vendors its own copy of
// @react-navigation/elements — its PlatformPressable takes a ColorValue where
// the standalone package still takes a string — and does not re-export either
// symbol from its entry point. Pairing the props with the component they are
// spread into is what keeps the tab bar type-checking under SDK 57.
export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }
        props.onPressIn?.(ev)
      }}
    />
  )
}
