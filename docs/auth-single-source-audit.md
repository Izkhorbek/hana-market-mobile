# Auth Single Source of Truth — Audit

Status: Stage 1 audit (pre-refactor). Verified against current code on branch `develop`.

## 1. Current storage map

| Concern | Where it lives | Key | Persisted fields |
| --- | --- | --- | --- |
| **Tokens** (truth, intended) | OS keychain via `secureTokenStore` (`utils/secureTokenStore.ts`) | `hana.auth.tokens.v1` | `token`, `refreshToken`, `expiresAt`, `refreshTokenExpiresAt` (one atomic JSON blob, `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`) |
| **Auth flags + profile** | AsyncStorage via zustand `persist` (`modules/Auth/auth-store.ts`) | `hana-auth-storage` | `user`, **`isAuthenticated`**, `locationGranted` (see `partialize`, lines 322‑328) |
| **In-memory only** | zustand store | — | `token`, `refreshToken`, `expiresAt`, `refreshTokenExpiresAt`, `isHydrated`, `sessionExpiredOnStart` |

**Problem:** `isAuthenticated` is persisted in AsyncStorage and restored independently of the keychain. AsyncStorage is therefore a *second* authority for "is there a session," which can disagree with the vault. This violates the single-source-of-truth requirement.

## 2. Every clear / logout trigger

| # | Location | Trigger | Notes |
| --- | --- | --- | --- |
| 1 | `auth-store.logout()` | User taps Logout (`profile.tsx:77`) | Intended. Wipes vault + AsyncStorage auth + query cache + Sentry + chat store. |
| 2 | `auth-store.fetchUser()` 403 branch (`:242`) | Profile fetch returns 403 | Logout. (401 is deliberately a no-op — interceptor owns it.) |
| 3 | `hydrateTokensFromVault` finally (`:391`) | `isAuthenticated && !token` after vault read | Startup: authed flag but no vault token. |
| 4 | `hydrateTokensFromVault` finally (`:407‑415`) | locally-expired access token **and** `refreshTokens()` returns null | Startup refresh failed. |
| 5 | `authLogoutSessionExpired()` (`:433‑449`) | Bridged from interceptor | Guarded by module-level `sessionExpiredHandled`. |
| 6 | Interceptor (`api.ts:126‑138`) | 401 → `runSingleFlightRefresh()` returns null **OR throws** → falls through to `authLogoutSessionExpired()` | **Bug: a thrown (network/5xx) refresh error also falls through to logout.** |
| 7 | Interceptor (`api.ts:139‑142`) | 401 with `_skipAuthRefresh` / already-retried / no access token | Also catches a 401 returned by the `/auth/refresh` endpoint itself. |

## 3. Startup timeline (cold start)

1. Module load: store created with `isAuthenticated:false`, `isHydrated:false`. Bridge setters registered (`:429‑452`).
2. zustand `persist` async-reads AsyncStorage and **merges** `{ user, isAuthenticated, locationGranted }`. `isAuthenticated` may now be `true` purely from disk.
3. `onRehydrateStorage` fires → `hydrateTokensFromVault(state)`.
4. `app/index.tsx` renders a spinner while `isHydrated === false`.
5. `hydrateTokensFromVault`:
   - reads the vault (async),
   - legacy AsyncStorage→keychain migration if needed,
   - if vault has a token → sets in-memory tokens + `isAuthenticated:true`,
   - `finally`: guard for "authed but no token"; if access token locally expired → `await refreshTokens()`; else `fetchUser()` (not awaited) then `setHydrated(true)`.
6. `setHydrated(true)` → `index.tsx` redirects to `/(tabs)/home` or `/(auth)/welcome` based on `isAuthenticated`.

## 4. Why the Login page is NOT reached when the token is gone

Two independent gaps:

**A. No navigation guard on authenticated routes.**
`app/index.tsx` is the *only* auth gate, and it only runs while the app sits on the `index` route. Once the app has redirected to `/(tabs)/home`, nothing re-evaluates auth. `app/(tabs)/_layout.tsx` has **no** `isAuthenticated` guard. So when the session is lost *mid-session* — e.g. the products query gets a 401, the interceptor runs refresh, refresh fails, `logout()` flips `isAuthenticated` to `false` — the user stays mounted on a now-broken Home (empty/error product list) and is never routed to Login.

**B. `isAuthenticated` persisted as authority.**
Because `isAuthenticated:true` is restored from AsyncStorage, Home can mount before/independently of the vault state. If the vault returns a *stale* token (see §5), `isAuthenticated` stays `true`, Home renders, and the only symptom is product 401s — which again hit gap A.

## 5. Root cause of the token loss after 2–3 force-kills

**Refresh-token rotation + non-durable (non-awaited) vault writes.**

- The backend **rotates** the refresh token on every `/auth/refresh` (confirmed by the rotation fallback comment, `auth-store.ts:192‑193`): a successful refresh issues a *new* refresh token and **invalidates the old one server-side**.
- Both `verifyOtp` (`:170`) and `refreshTokens` (`:201`) persist with **`void secureTokenStore.write(...)` — fire-and-forget, never awaited.** On Android the Keystore-backed `setItemAsync` can take tens to hundreds of ms.
- On every cold start where the access token is locally expired, `hydrateTokensFromVault` calls `refreshTokens()`, which rotates tokens and fires the un-awaited write.
- **If the user force-kills the app before that write flushes, the keychain still holds the OLD refresh token — which the server already invalidated.** Next launch reads the stale RT → `/auth/refresh` rejects it → session lost. This compounds over a few kills, exactly matching "after 2–3 force-kills."

**Secondary cause — spurious logout on transient errors.**
`refreshTokens()` catches *every* error and returns `null` (`:204‑207`). The interceptor treats `null` as "session dead" → `authLogoutSessionExpired()`. So a momentary **network blip or 5xx during refresh logs the user out**, even though the refresh token is still valid. Requirement: only clear on an *invalid/expired* refresh token.

## 6. Refactor plan

Vault (`secureTokenStore`) becomes the single source of truth. `isAuthenticated` is **derived**, never persisted.

1. **Durable writes (core fix).** `secureTokenStore.write` returns success; `verifyOtp` and `refreshTokens` **`await`** the write *before* relying on / returning the new tokens, so a rotated refresh token is persisted before the old one is discarded. Closes the force-kill window.
2. **Stop persisting `isAuthenticated`.** Remove it from `partialize` (keep only `user`, `locationGranted`). Initial in-memory `isAuthenticated` stays `false` until hydration proves a session.
3. **Derive session from the vault on hydration.** New rule set:
   - no refresh token, or `refreshTokenExpiresAt` in the past → **clear session → Login** (no "session expired" alert on a truly empty vault / fresh install).
   - refresh token valid + access token missing/expired → **refresh**; success → authenticated; invalid-RT failure → clear → Login; **transient (network/5xx) failure → keep session** (do not log out), let normal use retry.
   - refresh token valid + access token valid → authenticated; `fetchUser()` in background.
   - `setHydrated(true)` only after this completes.
4. **`refreshTokens()` distinguishes failure types.** Returns the token on success, `null` only on definitive invalid/expired RT (HTTP 400/401), and **throws** on transient errors. Interceptor: retry on token, `authLogoutSessionExpired()` only on `null`, keep session on throw.
5. **Navigation guard (core fix for "no Login").** A small `AuthGuard` mounted in `app/_layout.tsx` watches `isHydrated` + `isAuthenticated` via `useSegments()` and `router.replace('/(auth)/welcome')` whenever hydrated, unauthenticated, and not already in the `(auth)` group. Covers every protected group (tabs, post, settings, product, chat), so a mid-session logout always reaches Login.
6. **Gate product queries on hydration+auth.** `ProductsList` passes `enabled: isHydrated && isAuthenticated` so no fetch runs before hydration.
7. **Never logout because AsyncStorage disagrees with the vault.** Removed by construction: there is no longer a persisted `isAuthenticated` to disagree; the vault alone decides.

### Out of scope (unchanged)
Backend API, refresh-token flow itself, login/logout intent, product/chat/manner/guidance logic (except the auth `enabled` gate).
</content>
</invoke>
