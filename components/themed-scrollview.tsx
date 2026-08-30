import React from 'react'
import { ScrollView, type ScrollViewProps } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type ThemedScrollViewProps = ScrollViewProps & {
  lightColor?: string;
  darkColor?: string;
  withSafeBottom?: boolean;
  extraBottom?: number;
};

const ThemedScrollView = ({
  withSafeBottom = false,
  extraBottom = 16,
  contentContainerStyle,
  ...rest
}: ThemedScrollViewProps) => {
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      contentContainerStyle={[
        contentContainerStyle,
        withSafeBottom ? { paddingBottom: insets.bottom + extraBottom } : null,
      ]}
      {...rest}
    />
  )
}

export default ThemedScrollView