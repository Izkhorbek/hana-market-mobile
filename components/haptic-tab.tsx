import type { BottomTabBarButtonProps } from 'expo-router/tabs'
import { PlatformPressable } from 'expo-router/build/react-navigation/elements'
import * as Haptics from 'expo-haptics'

// SDK 56 cut expo-router loose from the standalone @react-navigation packages:
// it vendors its own copy, whose PlatformPressable takes a ColorValue where the
// standalone one still takes a string. The props type has a public home on
// `expo-router/tabs`; the component itself does not, hence the deep import.
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
