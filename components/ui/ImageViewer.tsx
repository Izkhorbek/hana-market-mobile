import { useThemeColors } from '@/hooks/use-theme-colors'
import { useResponsive } from '@/hooks/useResponsive'
import { useSafeAreaEdgeInsets } from '@/hooks/useSafeAreaEdgeInsets'
import { X } from 'lucide-react-native'
import React, { useCallback, useRef, useState } from 'react'
import {
    Dimensions,
    FlatList,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewToken
} from 'react-native'
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler'
import Animated, {
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated'
import RemoteImage from '../shared/RemoteImage'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const SPRING_CONFIG = {
    damping: 15,
    stiffness: 150,
    mass: 0.5,
}

const MIN_SCALE = 1
const MAX_SCALE = 4
const DOUBLE_TAP_SCALE = 2.5

interface ImageViewerProps {
    visible: boolean
    images: string[]
    initialIndex?: number
    onClose: () => void
}

interface ZoomableImageProps {
    uri: string
    width: number
    height: number
    onSwipeDown?: () => void
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ uri, width, height, onSwipeDown }) => {
    const scale = useSharedValue(1)
    const savedScale = useSharedValue(1)
    const translateX = useSharedValue(0)
    const translateY = useSharedValue(0)
    const savedTranslateX = useSharedValue(0)
    const savedTranslateY = useSharedValue(0)
    const focalX = useSharedValue(0)
    const focalY = useSharedValue(0)

    // Calculate image dimensions to fit screen while maintaining aspect ratio
    const imageAspect = width / height
    const screenAspect = SCREEN_WIDTH / SCREEN_HEIGHT

    let displayWidth = SCREEN_WIDTH
    let displayHeight = SCREEN_HEIGHT

    if (imageAspect > screenAspect) {
        displayHeight = SCREEN_WIDTH / imageAspect
    } else {
        displayWidth = SCREEN_HEIGHT * imageAspect
    }

    const getMaxTranslate = (currentScale: number) => {
        'worklet'
        const scaledWidth = displayWidth * currentScale
        const scaledHeight = displayHeight * currentScale
        const maxX = Math.max(0, (scaledWidth - SCREEN_WIDTH) / 2)
        const maxY = Math.max(0, (scaledHeight - SCREEN_HEIGHT) / 2)
        return { maxX, maxY }
    }

    const clampTranslate = (x: number, y: number, currentScale: number) => {
        'worklet'
        const { maxX, maxY } = getMaxTranslate(currentScale)
        return {
            x: Math.min(Math.max(x, -maxX), maxX),
            y: Math.min(Math.max(y, -maxY), maxY),
        }
    }

    const pinchGesture = Gesture.Pinch()
        .onStart((e) => {
            focalX.value = e.focalX
            focalY.value = e.focalY
        })
        .onUpdate((e) => {
            const newScale = Math.min(Math.max(savedScale.value * e.scale, MIN_SCALE), MAX_SCALE)
            scale.value = newScale

            // Adjust translation based on focal point
            if (newScale > MIN_SCALE) {
                const focalOffsetX = (focalX.value - SCREEN_WIDTH / 2)
                const focalOffsetY = (focalY.value - SCREEN_HEIGHT / 2)
                const scaleDiff = newScale - savedScale.value

                translateX.value = savedTranslateX.value - focalOffsetX * scaleDiff * 0.5
                translateY.value = savedTranslateY.value - focalOffsetY * scaleDiff * 0.5
            }
        })
        .onEnd(() => {
            savedScale.value = scale.value
            const clamped = clampTranslate(translateX.value, translateY.value, scale.value)
            translateX.value = withSpring(clamped.x, SPRING_CONFIG)
            translateY.value = withSpring(clamped.y, SPRING_CONFIG)
            savedTranslateX.value = clamped.x
            savedTranslateY.value = clamped.y
        })

    const panGesture = Gesture.Pan()
        .minDistance(10)
        .onUpdate((e) => {
            if (scale.value > MIN_SCALE) {
                // When zoomed, pan the image
                translateX.value = savedTranslateX.value + e.translationX
                translateY.value = savedTranslateY.value + e.translationY
            } else {
                // When not zoomed, allow vertical swipe to close
                translateY.value = e.translationY
            }
        })
        .onEnd((e) => {
            if (scale.value > MIN_SCALE) {
                const clamped = clampTranslate(translateX.value, translateY.value, scale.value)
                translateX.value = withSpring(clamped.x, SPRING_CONFIG)
                translateY.value = withSpring(clamped.y, SPRING_CONFIG)
                savedTranslateX.value = clamped.x
                savedTranslateY.value = clamped.y
            } else {
                // Check for swipe down to close
                if (e.translationY > 100 && e.velocityY > 0 && onSwipeDown) {
                    runOnJS(onSwipeDown)()
                } else {
                    translateY.value = withSpring(0, SPRING_CONFIG)
                }
            }
        })

    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd((e) => {
            if (scale.value > MIN_SCALE) {
                // Reset to original
                scale.value = withSpring(MIN_SCALE, SPRING_CONFIG)
                translateX.value = withSpring(0, SPRING_CONFIG)
                translateY.value = withSpring(0, SPRING_CONFIG)
                savedScale.value = MIN_SCALE
                savedTranslateX.value = 0
                savedTranslateY.value = 0
            } else {
                // Zoom in to tap point
                const tapX = e.x - SCREEN_WIDTH / 2
                const tapY = e.y - SCREEN_HEIGHT / 2

                scale.value = withSpring(DOUBLE_TAP_SCALE, SPRING_CONFIG)
                translateX.value = withSpring(-tapX * (DOUBLE_TAP_SCALE - 1), SPRING_CONFIG)
                translateY.value = withSpring(-tapY * (DOUBLE_TAP_SCALE - 1), SPRING_CONFIG)
                savedScale.value = DOUBLE_TAP_SCALE
                savedTranslateX.value = -tapX * (DOUBLE_TAP_SCALE - 1)
                savedTranslateY.value = -tapY * (DOUBLE_TAP_SCALE - 1)
            }
        })

    const composedGesture = Gesture.Simultaneous(
        pinchGesture,
        Gesture.Race(doubleTapGesture, panGesture)
    )

    const animatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            Math.abs(translateY.value),
            [0, 200],
            [1, 0.5],
            'clamp'
        )

        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
            ],
            opacity: scale.value > MIN_SCALE ? 1 : opacity,
        }
    })

    return (
        <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.imageContainer, animatedStyle]}>
                <RemoteImage
                    src={uri}
                    style={[styles.zoomImage, { width: displayWidth, height: displayHeight }]}
                    transition={200}
                />
            </Animated.View>
        </GestureDetector>
    )
}

const ImageViewer: React.FC<ImageViewerProps> = ({
    visible,
    images,
    initialIndex = 0,
    onClose,
}) => {
    const colors = useThemeColors()
    const insets = useSafeAreaEdgeInsets()
    const { ms, fs } = useResponsive()
    const [currentIndex, setCurrentIndex] = useState(initialIndex)
    const flatListRef = useRef<FlatList>(null)

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 })

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index != null) {
                setCurrentIndex(viewableItems[0].index)
            }
        }
    )

    const handleClose = useCallback(() => {
        onClose()
    }, [onClose])

    const renderItem = useCallback(
        ({ item }: { item: string }) => (
            <View style={styles.slide}>
                <ZoomableImage
                    uri={item}
                    width={SCREEN_WIDTH}
                    height={SCREEN_HEIGHT}
                    onSwipeDown={handleClose}
                />
            </View>
        ),
        [handleClose]
    )

    const keyExtractor = useCallback((_: string, idx: number) => String(idx), [])

    const getItemLayout = useCallback(
        (_: ArrayLike<string> | null | undefined, index: number) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
        }),
        []
    )

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            <GestureHandlerRootView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

                {/* Background */}
                <View style={styles.background} />

                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + ms(10) }]}>
                    <TouchableOpacity
                        style={[styles.closeButton, { width: ms(40), height: ms(40) }]}
                        onPress={handleClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <X size={ms(24)} color="#fff" />
                    </TouchableOpacity>

                    {images.length > 1 && (
                        <View style={styles.counterContainer}>
                            <Text style={[styles.counterText, { fontSize: fs(16) }]}>
                                {currentIndex + 1} / {images.length}
                            </Text>
                        </View>
                    )}

                    <View style={[styles.placeholder, { width: ms(40) }]} />
                </View>

                {/* Image Gallery */}
                <FlatList
                    ref={flatListRef}
                    data={images}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                    initialScrollIndex={initialIndex}
                    onViewableItemsChanged={onViewableItemsChanged.current}
                    viewabilityConfig={viewabilityConfig.current}
                    getItemLayout={getItemLayout}
                    initialNumToRender={1}
                    maxToRenderPerBatch={2}
                    windowSize={3}
                />

                {/* Pagination Dots */}
                {images.length > 1 && (
                    <View style={[styles.pagination, { paddingBottom: insets.bottom + ms(20) }]}>
                        {images.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    {
                                        width: index === currentIndex ? ms(20) : ms(8),
                                        height: ms(8),
                                        backgroundColor: index === currentIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                                    },
                                ]}
                            />
                        ))}
                    </View>
                )}
            </GestureHandlerRootView>
        </Modal>
    )
}

export default ImageViewer

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    closeButton: {
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterContainer: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    counterText: {
        color: '#fff',
        fontWeight: '600',
    },
    placeholder: {
        height: 40,
    },
    slide: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    zoomImage: {
        backgroundColor: 'transparent',
    },
    pagination: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    dot: {
        borderRadius: 4,
    },
})
