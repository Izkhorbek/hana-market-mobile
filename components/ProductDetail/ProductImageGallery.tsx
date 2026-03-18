import RemoteImage from '@/components/shared/RemoteImage'
import { AppLimits } from '@/constants/appLimits'
import React, { useCallback, useRef, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View, ViewToken } from 'react-native'

export interface GalleryImage {
  image_url: string
}

interface ProductImageGalleryProps {
  /** Primary product image (shown first) */
  mainImage: string | null | undefined
  /** Additional images from ProductImageDto[], sorted by sort_order */
  images?: GalleryImage[]
  /** Called when an image is pressed, with index and all image URLs */
  onImagePress?: (index: number, urls: string[]) => void
}

/**
 * Horizontal paging gallery for product images (up to 5 slides).
 * Each slide uses RemoteImage. Dot indicator shows current slide.
 */
const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  mainImage,
  images = [],
  onImagePress,
}) => {
  const { width } = useWindowDimensions()
  const [activeIndex, setActiveIndex] = useState(0)

  // Build deduped URL list: mainImage first, then extras up to 5 total
  const urls: string[] = []
  if (mainImage) urls.push(mainImage)

  for (const img of images) {
    if (urls.length >= 5) break
    if (img.image_url && img.image_url !== mainImage) urls.push(img.image_url)
  }

  // Ensure at least one placeholder so the gallery always renders
  if (urls.length === 0) urls.push('')

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 })

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index)
      }
    },
  )

  const handleImagePress = useCallback((index: number) => {
    if (onImagePress) {
      onImagePress(index, urls.filter(url => url !== ''))
    }
  }, [onImagePress, urls])

  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <Pressable
        style={[styles.slide, { width }]}
        onPress={() => handleImagePress(index)}
        disabled={!onImagePress}
      >
        <RemoteImage src={item || null} style={styles.image} resizeMode='cover' />
      </Pressable>
    ),
    [width, handleImagePress, onImagePress],
  )

  const keyExtractor = useCallback((_: string, idx: number) => String(idx), [])

  const getItemLayout = useCallback(
    (_: ArrayLike<string> | null | undefined, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={urls}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        nestedScrollEnabled
        scrollEnabled
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        getItemLayout={getItemLayout}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
      />

      {/* Dot indicator — only shown when there are multiple images */}
      {urls.length > 1 && (
        <View style={styles.dots} pointerEvents='none'>
          {urls.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}

      {/* Image counter badge */}
      {urls.length > 1 && (
        <View style={styles.counter} pointerEvents='none'>
          <Text style={styles.counterText}>{activeIndex + 1} / {urls.length}</Text>
        </View>
      )}
    </View>
  )
}

export default ProductImageGallery

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dots: {
    position: 'absolute',
    bottom: AppLimits.PARALLAX_EXTRA + 10,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    borderRadius: 4,
    height: 6,
  },
  dotActive: {
    width: 18,
    backgroundColor: '#ffffff',
    opacity: 1,
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#ffffff',
    opacity: 0.5,
  },
  counter: {
    position: 'absolute',
    bottom: AppLimits.PARALLAX_EXTRA + 10,
    right: 14,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
})
