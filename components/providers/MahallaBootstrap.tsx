import { useMyMahallaQuery } from '@/api/hooks'
import { useAuthStore } from '@/modules/Auth/auth-store'
import { useGasStore } from '@/modules/Gas/gas-store'
import { useEffect } from 'react'

/**
 * Mounts inside QueryClientProvider, lives for the whole authenticated session.
 *
 * Loads the user's mahalla membership ONCE right after login and seeds the gas
 * store's mahallaId + role. Hyperlocal screens (Mahalla tab, Gas) then render
 * with the right context on their very first frame — the gated gas queries can
 * fire immediately instead of waiting for a per-screen membership fetch, and the
 * UI never flashes another mahalla's stale data. On logout the store is cleared.
 */
export function MahallaBootstrap() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setMahallaId = useGasStore((s) => s.setMahallaId)
  const setRole = useGasStore((s) => s.setRole)
  const reset = useGasStore((s) => s.reset)

  // Warms the ['MAHALLA_MY'] cache so per-screen useMyMahallaQuery is a cache hit.
  const { data } = useMyMahallaQuery({ querySettings: { enabled: isAuthenticated } })

  // Seed (or clear) the gas context from the membership result.
  useEffect(() => {
    if (!isAuthenticated) {
      reset()
      return
    }
    const member = data?.data?.data ?? null
    if (!member) return
    // Switched to a different mahalla → drop the previous one's session/detail.
    const storedMahallaId = useGasStore.getState().mahallaId
    if (storedMahallaId !== null && storedMahallaId !== member.mahalla_id) reset()
    setMahallaId(member.mahalla_id)
    setRole(member.role)
  }, [isAuthenticated, data, setMahallaId, setRole, reset])

  return null
}
