import { useAuthStore } from '@/modules/Auth/auth-store'
import { useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'

/**
 * Global auth gate for the authenticated route groups.
 *
 * `app/index.tsx` only gates auth while the app sits on the `index` route — it
 * does NOT re-run once the user is inside `(tabs)` / `(post)` / `(settings)` /
 * `product` / `chat`. So when a session is lost MID-SESSION (e.g. the 401
 * interceptor logs out after a failed refresh, or startup hydration finds the
 * refresh token gone), nothing routed the user back to Login and they were left
 * on a broken screen with an empty/errored product list (see
 * docs/auth-single-source-audit.md §4A).
 *
 * Mounted once in `app/_layout.tsx`, this watches the DERIVED `isAuthenticated`
 * and redirects to the auth flow whenever the user is hydrated, unauthenticated,
 * and not already inside the `(auth)` group.
 */
export function AuthGuard() {
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    // Wait until the keychain-derived session state is known. Until then
    // `app/index.tsx` shows the splash spinner.
    if (!isHydrated) return

    const inAuthGroup = segments[0] === '(auth)'
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/welcome')
    }
  }, [isHydrated, isAuthenticated, segments, router])

  return null
}
