import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';

export type ThemedScrollViewProps = ScrollViewProps & {
  lightColor?: string;
  darkColor?: string;
}

const ThemedScrollView = ({
  style,
  lightColor,
  darkColor,
  ...rest
}: ThemedScrollViewProps) => {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  return <ScrollView
    style={[{ backgroundColor: color }, style]}
    {...rest}
  />
}


export default ThemedScrollView