import HanaLogoPlaceholder from '@/components/shared/HanaLogoPlaceholder'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { resolveImageUrl, resolveSizedImageUrl } from '@/utils/imageUrl'
import { Image, ImageContentFit, ImageStyle } from 'expo-image'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'

// Blurhash placeholder - neutral gray for smooth loading
const DEFAULT_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4'

interface RemoteImageProps {
  /** Server-relative path or full URL, e.g. "/product_images/abc.jpg" */
  src: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  placeholderColor?: string;
  /** Optional blurhash for placeholder */
  blurhash?: string;
  /** Cache priority: disk-only is best for lists */
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  /** Transition duration in ms */
  transition?: number;
  /** Optional width hint for requesting smaller variants from backend/CDN */
  requestedWidth?: number;
  /** Optional height hint for requesting smaller variants from backend/CDN */
  requestedHeight?: number;
  /** Optional quality hint for requesting smaller variants from backend/CDN */
  requestedQuality?: number;
  /** Show spinner while loading. Keep false for long lists to reduce jank. */
  showLoader?: boolean;
}

/**
 * Resolves relative server paths to full URLs.
 * Uses expo-image for automatic caching (memory + disk).
 * Shows a placeholder while loading, falls back to HanaLogo on error.
 */
const RemoteImage: React.FC<RemoteImageProps> = ({
  src,
  style,
  containerStyle,
  resizeMode = 'cover',
  placeholderColor = '#d0d0d0',
  blurhash = DEFAULT_BLURHASH,
  cachePolicy = 'disk',
  transition = 200,
  requestedWidth,
  requestedHeight,
  requestedQuality = 70,
  showLoader = false,
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const uri =
    requestedWidth && requestedWidth > 0
      ? resolveSizedImageUrl(src, {
          width: requestedWidth,
          height: requestedHeight,
          quality: requestedQuality,
        })
      : resolveImageUrl(src)
  const colors = useThemeColors()

  // Map resizeMode to expo-image contentFit
  const getContentFit = (): ImageContentFit => {
    switch (resizeMode) {
      case 'stretch': return 'fill'
      case 'center': return 'none' // none = no scaling, centered
      default: return resizeMode
    }
  }
  const contentFit = getContentFit()

  // Reset error/loading whenever the resolved URI changes (e.g. after upload)
  useEffect(() => {
    setLoading(!!uri)
    setError(false)
  }, [uri])

  // ── No URL or failed to load → show local fallback image ─────────────────
  if (!uri || error) {
    return (
      <View style={[styles.wrapper, styles.placeholder, containerStyle, style as ViewStyle]}>
        <HanaLogoPlaceholder />
      </View>
    )
  }

  // ── Remote image with expo-image (cached) ─────────────────────────────────
  return (
    <View style={[styles.wrapper, containerStyle, style as ViewStyle]}>
      {showLoader && loading && (
        <View style={[StyleSheet.absoluteFill, styles.loaderBox, { backgroundColor: placeholderColor }]}>
          <ActivityIndicator size='large' color={colors.primaryColor} />
        </View>
      )}
      <Image
        source={{ uri }}
        style={[style, showLoader && loading && styles.hidden]}
        contentFit={contentFit}
        placeholder={{ blurhash }}
        placeholderContentFit="cover"
        transition={transition}
        cachePolicy={cachePolicy}
        recyclingKey={uri}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true) }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  loaderBox: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  hidden: {
    opacity: 0,
  },
})

export default RemoteImage
