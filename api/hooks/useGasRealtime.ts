import { signalRService } from '@/api/services/signalr.service'
import { useGasStore } from '@/modules/Gas/gas-store'
import { useEffect } from 'react'

/**
 * Join a mahalla's live gas feed and patch the gas store from SignalR events.
 * Manages its own subscription lifecycle (independent of the chat listeners):
 * subscribes + joins the mahalla group on mount, unsubscribes + leaves on unmount.
 */
export const useGasRealtime = (mahallaId: number | null) => {
  const applySessionStarted = useGasStore((s) => s.applySessionStarted)
  const applyPositionUpdate = useGasStore((s) => s.applyPositionUpdate)
  const applyHouseholdStatusChange = useGasStore((s) => s.applyHouseholdStatusChange)
  const applySessionCompleted = useGasStore((s) => s.applySessionCompleted)

  useEffect(() => {
    if (!mahallaId) return

    let cancelled = false

    // Ensure the shared hub connection is up, then join the mahalla group.
    signalRService
      .connect()
      .then(() => {
        if (!cancelled) return signalRService.joinMahalla(mahallaId)
      })
      .catch(() => {
        // Connection/join failures are transient; realtime simply won't update.
      })

    const unsubscribes = [
      signalRService.onGasSessionStarted(applySessionStarted),
      signalRService.onGasPositionUpdated(applyPositionUpdate),
      signalRService.onGasHouseholdStatusChanged(applyHouseholdStatusChange),
      signalRService.onGasSessionCompleted(applySessionCompleted),
    ]

    return () => {
      cancelled = true
      unsubscribes.forEach((u) => u())
      signalRService.leaveMahalla(mahallaId).catch(() => {})
    }
  }, [
    mahallaId,
    applySessionStarted,
    applyPositionUpdate,
    applyHouseholdStatusChange,
    applySessionCompleted,
  ])
}
