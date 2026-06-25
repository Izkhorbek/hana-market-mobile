# Auth Single Source of Truth — Fix Report

Companion to `docs/auth-single-source-audit.md`. Implements the Stage 2 refactor:
the OS keychain (`secureTokenStore`) is now the **only** authority for "is there
a session"; `isAuthenticated` is derived, never persisted.

## Root cause

The production data loss had two compounding causes (audit §5):

1. **Non-durable token writes + refresh-token rotation (the data loss).** The
   backend rotates the refresh token on every `/auth/refresh` and invalidates
   the previous one server-side. `verifyOtp` and `refreshTokens` persisted with
   a **fire-and-forget `void secureTokenStore.write(...)`**. On Android the
   Keystore write takes tens–hundreds of ms. A force-kill in that window left
   the keychain holding the **old, server-invalidated** refresh token. The next
   launch refreshed with the stale token → rejected → session gone. Because most
   cold starts with an expired access token trigger a refresh, this compounded
   over 2–3 kills, exactly as reported.

2. **`isAuthenticated` persisted as authority + no mid-session nav guard (why
   Login was never reached).** `isAuthenticated:true` was restored from
   AsyncStorage independently of the vault, and `app/index.tsx` was the *only*
   auth gate — it does not re-run once the app is inside `(tabs)`. So when the
   session actually died, the user stayed on a broken Home (empty/errored
   product list) and was never routed to Login.

   A secondary trigger: `refreshTokens()` returned `null` on *any* error, so a
   transient network blip during refresh logged the user out.

## Files changed

| File | Change |
| --- | --- |
| `utils/secureTokenStore.ts` | `write()` now returns `boolean` and is documented as awaitable, so callers can persist durably before discarding a rotated token. |
| `modules/Auth/auth-store.ts` | `partialize` no longer persists `isAuthenticated`. `verifyOtp` **awaits** the vault write. `refreshTokens` **awaits** the write of rotated tokens *before* exposing them, and distinguishes invalid/expired RT (`return null`) from transient errors (`throw`). `hydrateTokensFromVault` rewritten to derive the session from the vault's refresh token. |
| `api/api.ts` | 401 interceptor logs out **only** when refresh returns `null` (invalid RT). A thrown (transient) refresh error now **keeps the session** and just rejects the request. |
| `components/providers/AuthGuard.tsx` | **New.** Global guard: when hydrated + unauthenticated + not in `(auth)`, `router.replace('/(auth)/welcome')`. Covers every protected group. |
| `app/_layout.tsx` | Mounts `<AuthGuard />`. |
| `components/Lists/ProductsList.tsx` | Products query gated `enabled: isHydrated && isAuthenticated`. |

## Storage model — before / after

**Before**
- Keychain `hana.auth.tokens.v1`: 4 tokens (written fire-and-forget).
- AsyncStorage `hana-auth-storage`: `user`, **`isAuthenticated`**, `locationGranted`.
- Two authorities for "session exists": the persisted boolean *and* the vault.
- `isAuthenticated` initial → restored from disk; could be `true` before/independent of the vault.

**After**
- Keychain `hana.auth.tokens.v1`: 4 tokens (writes **awaited** at verify + rotation). **Sole authority.**
- AsyncStorage `hana-auth-storage`: `user` (display cache only), `locationGranted`.
- `isAuthenticated` is **derived** from the vault's refresh token at startup and from live login/refresh/logout actions; never persisted, starts `false` until hydration proves a session.

## Startup decision tree (after)

```
read vault (+ legacy AsyncStorage→keychain migration)
│
├─ no refresh token  OR  refreshTokenExpiresAt passed
│     → logout() (clear session) → AuthGuard routes to /(auth)/welcome
│       (session-expired alert only if a refresh token existed but expired)
│
└─ refresh token valid → isAuthenticated = true
      ├─ access token missing/expired → refreshTokens()
      │     ├─ success            → stay authenticated
      │     ├─ null (invalid RT)  → logout() → Login
      │     └─ throw (transient)  → KEEP session (interceptor refreshes later)
      └─ access token valid → stay authenticated
   then: fetchUser() in background; setHydrated(true)
```

## Navigation changes

- `<AuthGuard />` mounted once in the root layout redirects to Login whenever the
  derived session is gone and the user is not already in `(auth)` — closing the
  mid-session gap that left users stranded on a broken Home.
- `app/index.tsx` is unchanged (still the cold-start splash gate); the profile
  Logout button's explicit `router.replace` is now redundant but harmless.

## Build result

- `npx tsc --noEmit` → **pass** (exit 0, no output).
- `npx eslint` on all changed files → **pass** (no errors; only a benign
  `MODULE_TYPELESS_PACKAGE_JSON` warning unrelated to this change).

## Manual QA instructions

Run on a physical Android device (the failure mode is timing-sensitive).

1. **Login → force-kill 5×.** Expect: still logged in each relaunch, product list loads.
2. **Login → force-kill while Home is loading.** Expect: still logged in.
3. **Login → force-kill immediately after OTP success.** Expect: either logged in, or a clean Login — and the *next* login must work (no corrupted session). The awaited write in `verifyOtp` makes the logged-in outcome the common case.
4. **Expire/remove the refresh token** (let `refreshTokenExpiresAt` pass, or clear the keychain entry) → reopen. Expect: Login page + "session expired" alert (only when a token existed).
5. **Missing token after hydration.** Expect: Login page, not a broken Home.
6. **Pre-hydration fetch.** Expect: no `/product/all` request fires before `isHydrated` (products query disabled until hydrated + authenticated).
7. **Logout button.** Expect: vault + user cache cleared, routed to Login.
8. **Access token expired + refresh token valid.** Expect: silent refresh, app stays logged in (no session-expired dialog).
9. **Multiple simultaneous 401s.** Expect: a single `/auth/refresh` call (single-flight) and all requests retried.
10. **No raw tokens logged.** Expect: logs show only codes (`AUTH_REFRESH_*`), never token values.

Suggested instrumentation while testing: filter logcat for `AUTH_` codes and
confirm `TOKEN_VAULT_WRITE_FAILED` never appears on the happy path.

## Remaining risks

- **Keychain write that genuinely fails** (returns `false`) is logged but not
  retried; the live session continues in memory but won't survive a kill. Rare
  (hardware/Keystore error). A future enhancement could retry or surface it.
- **`AuthGuard` redirect timing**: uses imperative `router.replace` in an effect
  (the standard expo-router auth-guard pattern). On the very first frame it may
  briefly co-fire with `app/index.tsx`'s `<Redirect>` to the same route —
  harmless, but worth confirming no flicker on low-end devices.
- **Background `fetchUser()` during hydration** may still 401→refresh on a stale
  access token; this is handled by the interceptor and never logs out on
  transient failures, but adds one extra request on the cold-start path.
- The legacy AsyncStorage→keychain migration path is retained; it can be removed
  once all installs are known to be on the keychain layout.
```
</content>
