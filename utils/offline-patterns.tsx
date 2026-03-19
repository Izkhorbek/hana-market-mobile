import { useIsOnline } from '@/hooks/useNetworkStatus'
import { MutationCache, QueryCache } from '@tanstack/react-query'

/**
 * ADVANCED OFFLINE-AWARE PATTERNS FOR NEBOR MARKETPLACE
 * =====================================================
 * 
 * This file documents advanced patterns for handling offline state
 * in a production React Native app. Use these patterns throughout your app.
 */

// ─────────────────────────────────────────────────────────────────
// PATTERN 1: Query Client with Offline Support
// ─────────────────────────────────────────────────────────────────

/**
 * Enhanced query client configuration for offline support
 * Add this to your queryClient.ts for production apps
 */
export const createOfflineAwareQueryClient = () => {
    return {
        defaultOptions: {
            queries: {
                // Keep cached data when offline
                staleTime: 5 * 60 * 1000, // 5 minutes

                // Don't retry when offline (network error)
                retry: (failureCount: number, error: any) => {
                    // Don't retry network errors
                    if (error?.message?.includes('Network Error')) {
                        return false
                    }
                    return failureCount < 3
                },

                // Show stale data while revalidating
                refetchOnReconnect: true,
            },
            mutations: {
                // Pause mutations when offline
                networkMode: 'offlineFirst' as const,

                retry: (failureCount: number, error: any) => {
                    if (error?.message?.includes('Network Error')) {
                        return false
                    }
                    return failureCount < 2
                },
            },
        },

        queryCache: new QueryCache({
            onError: (error, query) => {
                // Log query errors
                console.log('[QueryCache] Error in query:', query.queryKey, error)
            },
        }),

        mutationCache: new MutationCache({
            onError: (error, variables, context, mutation) => {
                // Log mutation errors
                console.log('[MutationCache] Mutation failed:', mutation.options.mutationKey, error)
            },
        }),
    }
}

// ─────────────────────────────────────────────────────────────────
// PATTERN 2: Offline-Aware Mutation Hook
// ─────────────────────────────────────────────────────────────────

/**
 * Example: Offline-aware send message mutation
 * 
 * Features:
 * - Queues messages when offline
 * - Auto-retries when back online
 * - Optimistic updates
 */
export const useOfflineAwareMutation = <TData, TVariables>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    options?: {
        onSuccess?: (data: TData) => void
        onError?: (error: Error) => void
        optimisticUpdate?: (variables: TVariables) => void
        rollback?: (variables: TVariables) => void
    }
) => {
    const isOnline = useIsOnline()

    const execute = async (variables: TVariables): Promise<TData | null> => {
        // Apply optimistic update immediately
        options?.optimisticUpdate?.(variables)

        if (!isOnline) {
            console.log('[OfflineMutation] Offline - queueing for later')
            // In production, you'd save to AsyncStorage queue here
            return null
        }

        try {
            const result = await mutationFn(variables)
            options?.onSuccess?.(result)
            return result
        } catch (error) {
            options?.rollback?.(variables)
            options?.onError?.(error as Error)
            throw error
        }
    }

    return { execute, isOnline }
}

// ─────────────────────────────────────────────────────────────────
// PATTERN 3: Custom Offline Banner Component
// ─────────────────────────────────────────────────────────────────

import { useNetwork } from '@/components/providers/NetworkProvider'
import { useTranslations } from '@/hooks/use-translation'
import { RefreshCw, WifiOff } from 'lucide-react-native'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

/**
 * Advanced offline banner with localization and retry
 */
export const AdvancedOfflineBanner: React.FC = () => {
    const { isConnected, isInternetReachable, refresh, isChecking } = useNetwork()
    const { t } = useTranslations()

    // Show if not connected OR connected but no internet
    const isOffline = !isConnected || !isInternetReachable

    if (!isOffline) return null

    return (
        <View style={styles.banner}>
            <WifiOff size={20} color="#FFFFFF" />
            <View style={styles.textContainer}>
                <Text style={styles.title}>
                    {!isConnected
                        ? t('network.no_connection', 'No Connection')
                        : t('network.no_internet', 'No Internet Access')
                    }
                </Text>
                <Text style={styles.subtitle}>
                    {t('network.offline_mode', 'You are in offline mode')}
                </Text>
            </View>
            <TouchableOpacity
                onPress={refresh}
                disabled={isChecking}
                style={styles.retryButton}
            >
                <RefreshCw
                    size={18}
                    color="#FFFFFF"
                    style={isChecking ? styles.spinning : undefined}
                />
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 50,
        left: 16,
        right: 16,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 9999,
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 2,
    },
    retryButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 8,
    },
    spinning: {
        // Note: For actual spinning animation, use Animated.loop
    },
})

// ─────────────────────────────────────────────────────────────────
// PATTERN 4: Conditional Rendering based on Network
// ─────────────────────────────────────────────────────────────────

/**
 * Component that shows different content based on network status
 */
export const NetworkAwareView: React.FC<{
    children: React.ReactNode
    offlineContent?: React.ReactNode
    showOfflineFallback?: boolean
}> = ({ children, offlineContent, showOfflineFallback = true }) => {
    const isOnline = useIsOnline()

    if (!isOnline && showOfflineFallback) {
        return offlineContent ? (
            <>{offlineContent}</>
        ) : (
            <View style={fallbackStyles.container}>
                <WifiOff size={48} color="#9CA3AF" />
                <Text style={fallbackStyles.title}>You're Offline</Text>
                <Text style={fallbackStyles.subtitle}>
                    Some features require an internet connection
                </Text>
            </View>
        )
    }

    return <>{children}</>
}

const fallbackStyles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
    },
})

// ─────────────────────────────────────────────────────────────────
// PATTERN 5: Disable Buttons when Offline
// ─────────────────────────────────────────────────────────────────

/**
 * Button that auto-disables when offline
 * Use for actions that require network
 */
export const NetworkButton: React.FC<{
    onPress: () => void
    title: string
    requiresNetwork?: boolean
    style?: any
}> = ({ onPress, title, requiresNetwork = true, style }) => {
    const isOnline = useIsOnline()
    const disabled = requiresNetwork && !isOnline

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            style={[
                buttonStyles.button,
                disabled && buttonStyles.disabled,
                style,
            ]}
        >
            <Text style={[
                buttonStyles.text,
                disabled && buttonStyles.disabledText,
            ]}>
                {title}
            </Text>
            {disabled && <WifiOff size={14} color="#9CA3AF" style={{ marginLeft: 8 }} />}
        </TouchableOpacity>
    )
}

const buttonStyles = StyleSheet.create({
    button: {
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabled: {
        backgroundColor: '#E5E7EB',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledText: {
        color: '#9CA3AF',
    },
})
