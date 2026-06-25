# Auth M1 + M2 Fast-Follow Report

Small, localized fix for the two medium risks from the final release review. No
auth refactor; no change to product/chat/manner/guidance logic or the Home error
classifier. Uses the **existing** `auth/logout` backend endpoint only.

## Risks addressed

- **M1** — The 401 interceptor gated its refresh attempt on the in-memory access
  token. After a transient startup-refresh failure, the access token can be
  `null` while the refresh token / session is still valid, so the next 401 skipped
  refresh and logged out instead of re-validating the refresh token.
- **M2** — `logout()` cleared the keychain fire-and-forget and never revoked the
  refresh token server-side, so logging out then immediately force-killing could
  leave a restorable token in the vault and silently restore the session.

## Files changed

| File | Change |
| --- | --- |
| `api/auth-bridge.ts` | Added `setHasRefreshableSession` / `hasRefreshableSession()` — a store-injected predicate for "a refresh is still worth attempting." |
| `api/api.ts` | 401 refresh gate changed from `getAuthToken()` to `getAuthToken() \|\| hasRefreshableSession()`. |
| `modules/Auth/auth-store.ts` | Registered `hasRefreshableSession` (hydrated + refresh token present). `logout()` is now `async`: synchronous memory/cache clear (instant UI logout), best-effort server-side revoke, then an **awaited** durable keychain clear. `AuthState.logout` typed `() => Promise<void>`. |
| `utils/secureTokenStore.ts` | `clear()` now returns `Promise<boolean>` (durable, awaitable). |
| `api/services/auth.service.ts` | `logout(accessToken?)` accepts an explicit token and sets `_skipAuthRefresh`, so the revoke authenticates even after the store cleared its in-memory token. |
| `app/(tabs)/profile.tsx` | Logout button handler `await`s `logout()` before navigating. |
| `app/(settings)/edit-profile.tsx` | Delete-account `onSuccess` `await`s `logout()` before navigating. |

## Exact M1 fix

1. **Bridge predicate** (`api/auth-bridge.ts`): new `hasRefreshableSession()`,
   registered by the store as:
   ```ts
   setHasRefreshableSession(() => {
     const s = useAuthStore.getState()
     return s.isHydrated && !!s.refreshToken
   })
   ```
2. **Interceptor gate** (`api/api.ts`): the 401 branch now runs when
   `getAuthToken() || hasRefreshableSession()` is true. So when the access token
   is `null` but the session is hydrated with a refresh token, the interceptor
   still calls the existing single-flight `runSingleFlightRefresh()`:
   - refresh **succeeds** → retry the original request with the new access token;
   - refresh returns **null** (invalid/expired RT) → `authLogoutSessionExpired()`;
   - refresh **throws** (transient) → keep the session, reject the request.

   Single-flight, the `_retried`/`_skipAuthRefresh` guards, and the transient-vs-
   invalid distinction in `refreshTokens` are all unchanged.

## Exact M2 fix

1. **Durable vault clear** (`utils/secureTokenStore.ts`): `clear()` returns
   `Promise<boolean>` (true once the delete flushed).
2. **`logout()` is now `async`** and ordered for both instant UX and durability:
   ```
   capture accessToken
   → void authService.logout(accessToken)   // best-effort server revoke, non-blocking, errors swallowed
   → chat reset + queryClient.clear()
   → set({ ...nulls, isAuthenticated:false }) // synchronous → UI logs out, AuthGuard redirects
   → setSentryUser(null)
   → await secureTokenStore.clear()           // durable; logs AUTH_LOGOUT_VAULT_CLEAR_FAILED on failure
   ```
   Memory is cleared synchronously, so the UI never blocks on the keychain or the
   network. The revoke is fired with the captured token (works after the memory
   clear) and uses `_skipAuthRefresh` so a 401 there can't re-enter refresh/logout
   (and `authLogoutSessionExpired` no-ops because memory is already cleared).
3. **Explicit user-logout sites await the clear** (`profile.tsx`,
   `edit-profile.tsx`) before navigating, so a force-kill right after logout
   cannot beat the keychain delete.

Belt-and-suspenders: even if the local clear is somehow interrupted, the
server-side revoke makes a leftover refresh token unusable on the next launch.

## No raw tokens logged

The revoke passes the token only as an `Authorization` header (never logged); the
clear-failure path logs the code `AUTH_LOGOUT_VAULT_CLEAR_FAILED` with no token;
`logger.normalizeError` still serializes only `message`/`stack`.

## Build / lint result

- `npx tsc --noEmit` → **PASS** (exit 0).
- `npx eslint` on the 7 changed files → **PASS** (0 errors). 3 pre-existing
  unused-variable **warnings** in `edit-profile.tsx` (`Platform`, `isKeyboardVisible`,
  `insets`) are unrelated to this change.

## Manual QA checklist

1. Login → force-kill 5× → still logged in each relaunch.
2. Airplane mode during cold-start refresh → app does **not** log out; after
   network returns, pull-to-refresh recovers and stays logged in. **(M1)**
3. Logout → immediately force-kill → reopen → stays logged out. **(M2)**
4. Force access token = null while refresh token valid (e.g. transient refresh at
   boot) → a 401 triggers refresh + retry, not logout. **(M1)**
5. Invalid/expired refresh token → Login page.
6. Inspect logcat/telemetry → no raw token values; `AUTH_LOGOUT_VAULT_CLEAR_FAILED`
   only on a genuine keychain failure.
7. (Online) Logout while connected → confirm `POST /auth/logout` fires once and the
   refresh token is revoked server-side (a captured pre-logout RT can no longer
   refresh).
8. Delete account → routed to auth, session durably cleared.

## Remaining risks

- **Extra best-effort revoke on session-expiry logouts.** Internal logouts
  (profile-fetch 403, hydration failure, session-expired) now also fire a
  best-effort `POST /auth/logout` when an access token is present. It's swallowed
  and `_skipAuthRefresh`-guarded, so harmless — just one extra (often-401) request
  on those paths.
- **Offline logout + force-kill before the awaited clear flushes.** Extremely
  narrow: keychain deletes are sub-millisecond and the handler awaits them; only a
  kill inside that window with no network for the revoke could leave a restorable
  token. Not observed; acceptable for release.
- **Server revoke semantics assumed.** We rely on the existing `auth/logout`
  endpoint revoking the refresh token. If the backend does not revoke, only the
  local durable clear protects M2 (still sufficient for the online and awaited
  cases). No backend change was made.

---
*No commit performed, per instructions.*
</content>
