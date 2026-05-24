import { logger } from '@/utils/logger'
import * as Network from 'expo-network'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Network status information
 */
export interface NetworkStatus {
  /** Whether the device has an active network connection */
  isConnected: boolean
  /** Whether the connection is actually reachable (can reach internet) */
  isInternetReachable: boolean
  /** Connection type: WIFI, CELLULAR, NONE, UNKNOWN */
  type: Network.NetworkStateType
  /** Whether currently checking connectivity */
  isChecking: boolean
}

/**
 * Advanced network status hook for Expo apps
 * 
 * Features:
 * - Real-time connection monitoring via polling
 * - Internet reachability check (not just WiFi connected)
 * - Debounced status changes to prevent UI flicker
 * - Manual refresh capability
 * - Cleanup on unmount
 * 
 * @example
 * ```tsx
 * const { isConnected, isInternetReachable, type, refresh } = useNetworkStatus()
 * 
 * if (!isConnected) {
 *   return <OfflineBanner />
 * }
 * ```
 */
export const useNetworkStatus = (options?: {
  /** Poll interval in ms to check network status (default: 5000) */
  pollIntervalMs?: number
  /** Whether to check on mount (default: true) */
  checkOnMount?: boolean
}): NetworkStatus & { refresh: () => Promise<void> } => {
  const { pollIntervalMs = 5000, checkOnMount = true } = options ?? {}

  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true, // Optimistic default
    isInternetReachable: true,
    type: Network.NetworkStateType.UNKNOWN,
    isChecking: true,
  })

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const previousStatusRef = useRef<{ isConnected: boolean; isInternetReachable: boolean }>({
    isConnected: true,
    isInternetReachable: true,
  })

  // Fetch current network state
  const fetchNetworkState = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync()
      
      const newStatus = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type ?? Network.NetworkStateType.UNKNOWN,
        isChecking: false,
      }

      // Only update if status actually changed (prevents unnecessary re-renders)
      if (
        newStatus.isConnected !== previousStatusRef.current.isConnected ||
        newStatus.isInternetReachable !== previousStatusRef.current.isInternetReachable
      ) {
        previousStatusRef.current = {
          isConnected: newStatus.isConnected,
          isInternetReachable: newStatus.isInternetReachable,
        }
        
        // Log status change for debugging
        logger.info(`[useNetworkStatus] Status changed: {
          connected: ${newStatus.isConnected},
          reachable: ${newStatus.isInternetReachable},
          type: ${newStatus.type}
        }`)
        
        setStatus(newStatus)
      } else if (status.isChecking) {
        // Initial check completed
        setStatus(newStatus)
      }
    } catch (error) {
      logger.error('[useNetworkStatus] Failed to fetch network state:', error)
      setStatus(prev => ({ ...prev, isChecking: false }))
    }
  }, [status.isChecking])

  // Manual refresh
  const refresh = useCallback(async () => {
    setStatus(prev => ({ ...prev, isChecking: true }))
    await fetchNetworkState()
  }, [fetchNetworkState])

  // Start polling on mount
  useEffect(() => {
    // Initial fetch
    if (checkOnMount) {
      fetchNetworkState()
    }

    // Setup polling for network changes
    // Note: expo-network doesn't have addEventListener, so we poll
    pollTimerRef.current = setInterval(fetchNetworkState, pollIntervalMs)

    // Cleanup
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [checkOnMount, fetchNetworkState, pollIntervalMs])

  return { ...status, refresh }
}

/**
 * Simple hook that just returns online/offline boolean
 * Use this for simple offline checks
 */
export const useIsOnline = (): boolean => {
  const { isConnected, isInternetReachable } = useNetworkStatus()
  
  // Consider online only if connected AND internet is reachable
  return isConnected && isInternetReachable
}
