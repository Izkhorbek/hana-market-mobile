import { useMemo } from 'react'
import { PixelRatio, useWindowDimensions } from 'react-native'

// Base design dimensions (standard iPhone 14 Pro / common Android)
const BASE_WIDTH = 393
const BASE_HEIGHT = 852

// Breakpoints for device categories
const BREAKPOINTS = {
  small: 360,   // Small phones (iPhone SE, budget Android)
  medium: 390,  // Standard phones (iPhone 14, Pixel 6)
  large: 430,   // Large phones (iPhone 14 Pro Max, Galaxy S23 Ultra)
  tablet: 768,  // Tablets
} as const

type DeviceSize = 'small' | 'medium' | 'large' | 'tablet';

interface ResponsiveValues {
  // Screen dimensions
  width: number;
  height: number;
  
  // Scale factors
  widthScale: number;
  heightScale: number;
  fontScale: number;
  
  // Device info
  deviceSize: DeviceSize;
  isSmallDevice: boolean;
  isLargeDevice: boolean;
  isTablet: boolean;
  
  // Utility functions
  wp: (percentage: number) => number;  // Width percentage
  hp: (percentage: number) => number;  // Height percentage
  sp: (size: number) => number;        // Scale pixel (for dimensions)
  fs: (size: number) => number;        // Font size scaling
  ms: (size: number, factor?: number) => number; // Moderate scale
}

/**
 * Hook for responsive design utilities
 * Provides scaling functions and device info for adaptive UI
 */
export const useResponsive = (): ResponsiveValues => {
  const { width, height } = useWindowDimensions()
  
  return useMemo(() => {
    // Calculate scale factors
    const widthScale = width / BASE_WIDTH
    const heightScale = height / BASE_HEIGHT
    
    // Font scale - clamped to prevent extreme scaling
    const rawFontScale = Math.min(widthScale, heightScale)
    const fontScale = Math.max(0.85, Math.min(1.2, rawFontScale))
    
    // Determine device size category
    const deviceSize: DeviceSize = 
      width >= BREAKPOINTS.tablet ? 'tablet' :
      width >= BREAKPOINTS.large ? 'large' :
      width >= BREAKPOINTS.medium ? 'medium' : 'small'
    
    // Device flags
    const isSmallDevice = width < BREAKPOINTS.medium
    const isLargeDevice = width >= BREAKPOINTS.large
    const isTablet = width >= BREAKPOINTS.tablet
    
    // Width percentage
    const wp = (percentage: number): number => {
      return PixelRatio.roundToNearestPixel((width * percentage) / 100)
    }
    
    // Height percentage
    const hp = (percentage: number): number => {
      return PixelRatio.roundToNearestPixel((height * percentage) / 100)
    }
    
    // Scale pixel (for dimensions like padding, margin, sizes)
    const sp = (size: number): number => {
      const scaledSize = size * widthScale
      return PixelRatio.roundToNearestPixel(scaledSize)
    }
    
    // Font size scaling (more conservative)
    const fs = (size: number): number => {
      const scaledSize = size * fontScale
      // Ensure minimum readable size
      return Math.max(10, PixelRatio.roundToNearestPixel(scaledSize))
    }
    
    // Moderate scale - scales less aggressively
    const ms = (size: number, factor: number = 0.5): number => {
      const scaledSize = size + (size * widthScale - size) * factor
      return PixelRatio.roundToNearestPixel(scaledSize)
    }
    
    return {
      width,
      height,
      widthScale,
      heightScale,
      fontScale,
      deviceSize,
      isSmallDevice,
      isLargeDevice,
      isTablet,
      wp,
      hp,
      sp,
      fs,
      ms,
    }
  }, [width, height])
}

/**
 * Get responsive spacing based on device size
 */
export const getResponsiveSpacing = (
  deviceSize: DeviceSize
): { xs: number; sm: number; md: number; lg: number; xl: number } => {
  switch (deviceSize) {
    case 'small':
      return { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 }
    case 'medium':
      return { xs: 4, sm: 8, md: 14, lg: 18, xl: 24 }
    case 'large':
      return { xs: 6, sm: 10, md: 16, lg: 22, xl: 28 }
    case 'tablet':
      return { xs: 8, sm: 12, md: 20, lg: 28, xl: 36 }
    default:
      return { xs: 4, sm: 8, md: 14, lg: 18, xl: 24 }
  }
}

/**
 * Get responsive font sizes based on device size
 */
export const getResponsiveFontSizes = (
  deviceSize: DeviceSize
): { caption: number; body: number; subtitle: number; title: number; headline: number } => {
  switch (deviceSize) {
    case 'small':
      return { caption: 11, body: 13, subtitle: 15, title: 18, headline: 22 }
    case 'medium':
      return { caption: 12, body: 14, subtitle: 16, title: 20, headline: 24 }
    case 'large':
      return { caption: 13, body: 15, subtitle: 17, title: 22, headline: 28 }
    case 'tablet':
      return { caption: 14, body: 16, subtitle: 18, title: 24, headline: 32 }
    default:
      return { caption: 12, body: 14, subtitle: 16, title: 20, headline: 24 }
  }
}

export default useResponsive
