import HanaLogoPlaceholder from '@/components/shared/HanaLogoPlaceholder';
import { resolveImageUrl } from '@/utils/imageUrl';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

// Bundler resolves require() at build time — this is the correct way to use local assets
const FALLBACK_IMAGE = require('@/assets/images/not_exists_image.png');

interface RemoteImageProps {
  /** Server-relative path or full URL, e.g. "/product_images/abc.jpg" */
  src: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  placeholderColor?: string;
}

/**
 * Resolves relative server paths to full URLs.
 * Shows a spinner while loading, and falls back to not_exists_image.png
 * if src is empty or the remote image fails to load.
 */
const RemoteImage: React.FC<RemoteImageProps> = ({
  src,
  style,
  containerStyle,
  resizeMode = 'cover',
  placeholderColor = '#d0d0d0',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const uri = resolveImageUrl(src);

  // Reset error/loading whenever the resolved URI changes (e.g. after upload)
  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [uri]);

  // ── No URL or failed to load → show local fallback image ─────────────────
  if (!uri || error) {
    return (
      <View style={[styles.wrapper, styles.placeholder, containerStyle, style as ViewStyle]}>
        <HanaLogoPlaceholder />
      </View>
    );
  }

  // ── Remote image ──────────────────────────────────────────────────────────
  return (
    <View style={[styles.wrapper, containerStyle, style as ViewStyle]}>
      {loading && (
        <View style={[StyleSheet.absoluteFillObject, styles.loaderBox, { backgroundColor: placeholderColor }]}>
          <ActivityIndicator size="small" color="#999" />
        </View>
      )}
      <Image
        source={{ uri }}
        style={[style, loading && styles.hidden]}
        resizeMode={resizeMode}
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
      />
    </View>
  );
};

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
});

export default RemoteImage;
