import { useResponsive } from '@/hooks/useResponsive'
import { useSafeAreaEdgeInsets } from '@/hooks/useSafeAreaEdgeInsets'
import { X } from 'lucide-react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
    Dimensions,
    FlatList,
    ListRenderItemInfo,
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
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ uri, width, height }) => {
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
        .manualActivation(true)
        .onTouchesMove((_, stateManager) => {
            if (scale.value > MIN_SCALE) {
                stateManager.activate()
            } else {
                stateManager.fail()
            }
        })
        .onUpdate((e) => {
            translateX.value = savedTranslateX.value + e.translationX
            translateY.value = savedTranslateY.value + e.translationY
        })
        .onEnd(() => {
            const clamped = clampTranslate(translateX.value, translateY.value, scale.value)
            translateX.value = withSpring(clamped.x, SPRING_CONFIG)
            translateY.value = withSpring(clamped.y, SPRING_CONFIG)
            savedTranslateX.value = clamped.x
            savedTranslateY.value = clamped.y
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
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
            ],
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
    const insets = useSafeAreaEdgeInsets()
    const { ms, fs } = useResponsive()
    const [currentIndex, setCurrentIndex] = useState(initialIndex)
    const flatListRef = useRef<FlatList<string>>(null)
    const thumbnailListRef = useRef<FlatList<string>>(null)
    const showThumbnailSwiper = images.length > 1

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 })

    const scrollToIndex = useCallback((index: number, animated = true) => {
        flatListRef.current?.scrollToIndex({ index, animated })
    }, [])

    const scrollThumbnailsToIndex = useCallback((index: number, animated = true) => {
        if (!showThumbnailSwiper) {
            return
        }

        thumbnailListRef.current?.scrollToIndex({
            index,
            animated,
            viewPosition: 0.5,
        })
    }, [showThumbnailSwiper])

    useEffect(() => {
        if (!visible || images.length === 0) {
            return
        }

        const nextIndex = Math.min(Math.max(initialIndex, 0), images.length - 1)
        setCurrentIndex(nextIndex)

        requestAnimationFrame(() => {
            scrollToIndex(nextIndex, false)
            scrollThumbnailsToIndex(nextIndex, false)
        })
    }, [images.length, initialIndex, scrollThumbnailsToIndex, scrollToIndex, visible])

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index != null) {
                const nextIndex = viewableItems[0].index
                setCurrentIndex(nextIndex)
                scrollThumbnailsToIndex(nextIndex)
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
                    height={SCREEN_HEIGHT - (insets.top + insets.bottom + 20)}
                />
            </View>
        ),
        [handleClose]
    )

    const handleThumbnailPress = useCallback((index: number) => {
        setCurrentIndex(index)
        scrollToIndex(index)
        scrollThumbnailsToIndex(index)
    }, [scrollThumbnailsToIndex, scrollToIndex])

    const renderThumbnail = useCallback(
        ({ item, index }: ListRenderItemInfo<string>) => {
            const isActive = index === currentIndex

            return (
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleThumbnailPress(index)}
                    style={[
                        styles.thumbnailButton,
                        {
                            borderColor: isActive ? '#fff' : 'rgba(255,255,255,0.28)',
                            opacity: isActive ? 1 : 0.72,
                        },
                    ]}
                >
                    <RemoteImage
                        src={item}
                        style={styles.thumbnailImage}
                        transition={120}
                    />
                </TouchableOpacity>
            )
        },
        [currentIndex, handleThumbnailPress]
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

    const getThumbnailItemLayout = useCallback(
        (_: ArrayLike<string> | null | undefined, index: number) => ({
            length: 72,
            offset: 72 * index,
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
            <GestureHandlerRootView style={[styles.container]}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

                {/* Background */}
                <View style={styles.background} />

                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + ms(20) }]}>
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

                {showThumbnailSwiper && (
                    <View
                        style={[
                            styles.thumbnailRail,
                            {
                                paddingBottom: insets.bottom + ms(18),
                                backgroundColor: 'rgba(0,0,0,0.22)',
                            },
                        ]}
                    >
                        <FlatList
                            ref={thumbnailListRef}
                            data={images}
                            renderItem={renderThumbnail}
                            keyExtractor={keyExtractor}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.thumbnailListContent}
                            getItemLayout={getThumbnailItemLayout}
                        />
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
    thumbnailRail: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    thumbnailListContent: {
        paddingHorizontal: 12,
        gap: 8,
    },
    thumbnailButton: {
        width: 64,
        height: 64,
        borderRadius: 16,
        borderWidth: 2,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
})
