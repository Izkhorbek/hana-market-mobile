import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef } from 'react'
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { queryClient } from '../../api/queryClient'
import { NetworkStatus, useNetworkStatus } from '../../hooks/useNetworkStatus'

interface NetworkContextValue extends NetworkStatus {
    /** Manually refresh network status */
    refresh: () => Promise<void>
    /** Retry all failed queries when back online */
    retryFailedQueries: () => void
}

const NetworkContext = createContext<NetworkContextValue | null>(null)

/**
 * Hook to access network status from context
 * Must be used within NetworkProvider
 */
export const useNetwork = (): NetworkContextValue => {
    const context = useContext(NetworkContext)
    if (!context) {
        throw new Error('useNetwork must be used within NetworkProvider')
    }
    return context
}

interface NetworkProviderProps {
    children: ReactNode
    /** Show offline banner (default: true) */
    showOfflineBanner?: boolean
    /** Custom offline banner component */
    CustomOfflineBanner?: React.ComponentType<{ onRetry: () => void }>
}

/**
 * Network Provider that wraps your app
 * 
 * Features:
 * - Global network status accessible via useNetwork()
 * - Auto-shows offline banner when disconnected
 * - Auto-retries failed queries when back online
 * - Animated banner transitions
 * 
 * @example
 * ```tsx
 * // In your _layout.tsx
 * export default function RootLayout() {
 *   return (
 *     <NetworkProvider>
 *       <Stack />
 *     </NetworkProvider>
 *   )
 * }
 * 
 * // In any component
 * const { isConnected, refresh } = useNetwork()
 * ```
 */
export const NetworkProvider: React.FC<NetworkProviderProps> = ({
    children,
    showOfflineBanner = true,
    CustomOfflineBanner,
}) => {
    const networkStatus = useNetworkStatus()
    const previouslyOffline = useRef(false)

    // Animated value for banner slide
    const slideAnim = useRef(new Animated.Value(-100)).current

    // Retry all failed queries when coming back online
    const retryFailedQueries = useCallback(() => {
        // Invalidate all queries to refetch
        queryClient.invalidateQueries()

        // Resume any paused mutations
        queryClient.resumePausedMutations()
    }, [])

    // Auto-retry when coming back online
    useEffect(() => {
        if (previouslyOffline.current && networkStatus.isConnected) {
            console.log('[NetworkProvider] Back online - retrying failed queries')
            retryFailedQueries()
        }
        previouslyOffline.current = !networkStatus.isConnected
    }, [networkStatus.isConnected, retryFailedQueries])

    // Animate banner
    useEffect(() => {
        if (showOfflineBanner) {
            Animated.spring(slideAnim, {
                toValue: networkStatus.isConnected ? -100 : 0,
                useNativeDriver: true,
                tension: 100,
                friction: 10,
            }).start()
        }
    }, [networkStatus.isConnected, showOfflineBanner, slideAnim])

    const contextValue: NetworkContextValue = {
        ...networkStatus,
        retryFailedQueries,
    }

    return (
        <NetworkContext.Provider value={contextValue}>
            {children}
            {showOfflineBanner && !networkStatus.isConnected && (
                <OfflineBanner
                    slideAnim={slideAnim}
                    onRetry={networkStatus.refresh}
                    isChecking={networkStatus.isChecking}
                />
            )}
        </NetworkContext.Provider>
    )
}

// Default offline banner component
interface OfflineBannerProps {
    slideAnim: Animated.Value
    onRetry: () => void
    isChecking: boolean
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({
    slideAnim,
    onRetry,
    isChecking,
}) => {
    return (
        <Animated.View
            style={[
                styles.banner,
                { transform: [{ translateY: slideAnim }] },
            ]}
        >
            <View style={styles.bannerContent}>
                <View style={styles.bannerTextContainer}>
                    <Text style={styles.bannerTitle}>No Internet Connection</Text>
                    <Text style={styles.bannerSubtitle}>
                        Some features may be unavailable
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={onRetry}
                    disabled={isChecking}
                >
                    <Text style={styles.retryText}>
                        {isChecking ? '...' : 'Retry'}
                    </Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    )
}

const { width } = Dimensions.get('window')

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FF6B6B',
        paddingTop: 50, // Account for status bar
        paddingBottom: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 9999,
    },
    bannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: width - 32,
    },
    bannerIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    bannerTextContainer: {
        flex: 1,
    },
    bannerTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    bannerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 2,
    },
    retryButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        marginLeft: 12,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
})
