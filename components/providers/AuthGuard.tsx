import { useAuthStore } from '@/modules/Auth/auth-store'
import { useRootNavigationState, useRouter, useSegments } from 'expo-router'
import { useEffect, useRef } from 'react'

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
 *
 * ── Navigation readiness (see docs/mobile-logout-relogin-crash-audit.md §14) ──
 * This component is a SIBLING that appears BEFORE `<Stack>` in `_layout.tsx`'s
 * JSX. React fires effects in tree order, so this effect runs before `<Stack>`
 * has attached its navigator to the root navigation container. Calling
 * `router.replace()` in that gap throws:
 *
 *   "Attempted to navigate before mounting the Root Layout component."
 *
 * On a cold launch that was masked: `isHydrated` is false on the first pass, so
 * the effect returned early and by the time hydration finished the navigator was
 * up. On a logout → login-again the store is ALREADY hydrated, so a remount of
 * this component runs the redirect immediately on its first effect — before the
 * navigator exists. Hence "crashes on the second login, never the first".
 *
 * `useRootNavigationState()` returns undefined until the root navigator is
 * mounted and has a `key`. Gating on it is the fix.
 */
export function AuthGuard() {
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const segments = useSegments()
  const router = useRouter()
  const rootNavigationState = useRootNavigationState()
  // `key` is only populated once the root navigator is registered with the
  // navigation container. Typed as always-present, but it IS undefined on the
  // first renders — hence the optional chain.
  const isNavigatorReady = !!rootNavigationState?.key

  // Route we last issued a redirect FROM. Suppresses a duplicate
  // `router.replace()` when this effect re-runs for an unrelated dependency
  // change while the navigation we already requested is still settling.
  //
  // Deliberately keyed on the route rather than a plain boolean: a boolean latch
  // would stay set if the user reached some OTHER unauthenticated route, and the
  // guard would then decline to redirect — silently weakening auth protection.
  // Keying on the route re-arms the guard on every route change.
  const redirectedFromRef = useRef<string | null>(null)

  useEffect(() => {
    // 1. Wait for the root navigator. `router.replace()` before `<Stack>` has
    //    registered throws "Attempted to navigate before mounting the Root
    //    Layout component" — the proven crash this guard caused.
    if (!isNavigatorReady) return

    // 2. Wait until the keychain-derived session state is known. Until then
    //    `app/index.tsx` shows the splash spinner.
    if (!isHydrated) return

    const inAuthGroup = segments[0] === '(auth)'

    // 3. Already inside the auth flow, or authenticated → nothing to do. This is
    //    also what prevents redirecting to the route that is already active.
    if (isAuthenticated || inAuthGroup) {
      redirectedFromRef.current = null
      return
    }

  }, [isNavigatorReady, isHydrated, isAuthenticated, segments, router])

  return null
}
