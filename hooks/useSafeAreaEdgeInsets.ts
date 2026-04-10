import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Cross-platform safe area insets without global SafeAreaProvider.
 * Uses react-native-safe-area-context hook but with intelligent fallbacks.
 * 
 * Returns: { top, bottom, left, right }
 * - iOS: Actual device notch/Dynamic Island values
 * - Android: StatusBar height + bottom gesture area
 */
export const useSafeAreaEdgeInsets = () => {
  const insets = useSafeAreaInsets();

  return Platform.select({
    ios: {
      // On iOS, use actual safe area insets (notch, Dynamic Island, home indicator)
      top: insets.top,
      bottom: insets.bottom,
      left: insets.left,
      right: insets.right,
    },
    android: {
      // On Android, use StatusBar height for top, handle gesture bar
      top: StatusBar.currentHeight || 0,
      bottom: insets.bottom, // Gesture bar at bottom (Pixel/Samsung)
      left: 0,
      right: 0,
    },
    default: insets, // Fallback for other platforms
  });
};

/**
 * Lightweight EdgeInsets without any hook dependencies.
 * Use this if you want zero reliance on react-native-safe-area-context.
 */
export const getEdgeInsetsSync = () => {
  const statusBarHeight = StatusBar.currentHeight || 0;

  return Platform.select({
    ios: {
      top: 44, // Notch: 20-44px | Dynamic Island: 54px | Notchless: 47px
      bottom: 34, // Home indicator on modern iPhones
      left: 0,
      right: 0,
    },
    android: {
      top: statusBarHeight,
      bottom: 0, // Android rarely needs bottom padding
      left: 0,
      right: 0,
    },
    default: { top: 0, bottom: 0, left: 0, right: 0 },
  });
};
