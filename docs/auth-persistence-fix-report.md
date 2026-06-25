# Auth Persistence Fix Report

> Companion to `docs/auth-persistence-audit.md`. Scope implemented: **A + B + C + D**
> (the data-loss fixes plus the product-query hydration gate). Fix **E** (Home
> error-message discrimination) was intentionally **not** implemented in this pass.

## Root Cause

Token/user disappearing after force-kill was **not** token expiry. It was a
non-atomic, two-store persistence model destroyed by a startup guard:

1. **Write race.** Tokens were persisted to the OS keychain with **fire-and-forget**
   `void secureTokenStore.write(...)` (login & refresh), while `isAuthenticated`/`user`
   went to AsyncStorage on a separate async path. A force-kill could land one write
   but not the other → the two stores disagree on reopen.
2. **Destructive startup guard.** When AsyncStorage said `isAuthenticated: true`
   but the keychain returned no token, `hydrateTokensFromVault` called `logout()`,
   which runs `secureTokenStore.clear()` — converting a *recoverable* desync into a
   *permanent* wipe.
3. **Read swallowed errors.** `secureTokenStore.read()` returned an all-null object
   on **any** thrown error, so a transient Android Keystore failure right after a
   force-stop was indistinguishable from a genuinely empty vault — and fed the same
   destructive guard. No retry.
4. **No query gate.** `useInfiniteProductsQuery` had no `enabled` condition, so on a
   tab remount/refetch it could fire before the token was restored.

## Files Changed

| File | Fix | Summary |
| --- | --- | --- |
| `utils/secureTokenStore.ts` | **A** | `read()` now retries the keychain on a *thrown* error (3 attempts, 150 ms apart), distinguishes a genuinely empty vault (`getItemAsync` → `null`) from a hardware failure, and throws a new `SecureTokenReadError` when unreadable after retries. Corrupt-JSON still degrades to empty (via `parseVault`). |
| `modules/Auth/auth-store.ts` | **B** | `verifyOtp` and `refreshTokens` now **`await`** `secureTokenStore.write(...)` instead of fire-and-forget, guaranteeing the vault is persisted before navigation / a possible kill. |
| `modules/Auth/auth-store.ts` | **C** | `hydrateTokensFromVault` now `catch`es `SecureTokenReadError`: on a read failure it ends the session **in memory only** (no `logout()`, no `secureTokenStore.clear()`), preserving the vault for the next launch. A genuinely empty vault keeps the original guard behaviour. |
| `api/hooks/useProduct.ts` | **D** | `useInfiniteProductsQuery` is now gated with `enabled: isHydrated && (querySettings.enabled ?? true)` (added `useAuthStore` import). |

## Fix Detail

**A — keychain read hardening (`secureTokenStore.ts`)**
- Added `SecureTokenReadError` (exported), `parseVault()` helper, and a bounded
  retry loop. Only a thrown `getItemAsync` triggers retry/throw; `null` (empty) and
  corrupt JSON resolve normally to an empty object. Web path unchanged.

**B — durable writes (`auth-store.ts`)**
- `verifyOtp`: `await secureTokenStore.write(...)`. The screen already awaits
  `verifyOtp` before navigating, so the vault is guaranteed written pre-navigation.
- `refreshTokens`: `await secureTokenStore.write(nextState)` before returning the
  new token, so a kill right after rotation can't strand an invalidated refresh token.
- `write()` swallows its own errors, so awaiting never rejects the login/refresh flow.

**C — non-destructive guard (`auth-store.ts`)**
- New `readFailed` flag. On `SecureTokenReadError`, the `finally` block resets auth
  **in memory** (`isAuthenticated: false`, tokens null, `sessionExpiredOnStart: true`)
  and marks hydration done — but never calls `logout()`/`clear()`, so the persisted
  keychain vault survives. All other paths (genuine empty, locally-expired refresh,
  normal validation) are unchanged.

**D — product query gate (`useProduct.ts`)**
- Query waits for `isHydrated`; any caller-supplied `enabled` is still honoured.

## What Was NOT Touched (per constraints)

- Backend / REST contract — unchanged.
- Token-refresh logic (`refreshTokens`, single-flight interceptor) — preserved.
- Product fetch logic (endpoint, params, pagination) — unchanged except the gate.
- Login/logout UX — unchanged.
- No auth rewrite, no dependency/build/.env changes.
- **Fix E (Home error message)** — deferred; the misleading "set your address"
  copy still appears for auth failures. See audit §6.

## Build Result

- `npx tsc --noEmit` → **clean** (exit 0, no output).
- ESLint on the three changed files → **no errors** (only a pre-existing, unrelated
  `MODULE_TYPELESS_PACKAGE_JSON` Node warning about `eslint.config.js`). Note: the
  `npx expo lint` wrapper failed to bootstrap (`yarnpkg not recognized`), so ESLint
  was run directly via `npx eslint`.

## Manual QA — NOT YET RUN

Requires a physical Android device + force-stop cycles; not executed in this pass.
Recommended checklist (from the task brief):

1. Fresh install → login → close normally → reopen → still logged in.
2. Login → force-kill → reopen → still logged in.
3. Force-kill 3× in a row → still logged in. **(primary regression target)**
4. Expired access token + valid refresh token → refresh succeeds, stays logged in.
5. Invalid refresh token → logged out intentionally.
6. Product fetch does not run before auth hydration (verify no 401 burst on cold start).
7. Home does not show the location error for a transient session-restore case.
8. Logout still clears tokens intentionally.
9. No regression in Manner Temperature / Guidance modals.
10. Android physical-device pass.

## Remaining Risks

- **Residual read-failure UX (rare).** If the Keystore is still unreadable after all
  retries (Fix A), Fix C sends the user to the login screen with a "session expired"
  alert even though the vault is intact. This is a deliberate safe fallback (no data
  destroyed), but the user must re-login that session. Frequency should be near-zero
  once retries succeed; monitor `AUTH_HYDRATE_VAULT_READ_FAILED` / `TOKEN_VAULT_READ_RETRY`
  telemetry to confirm.
- **`isAuthenticated: false` persists in the read-failure path.** Because the auth
  flag lives in AsyncStorage, the in-memory reset is written there too, so the vault
  isn't auto-recovered next launch — re-login is required (it overwrites the vault
  cleanly). Fully eliminating this needs the single-source-of-truth refactor (out of
  scope / explicitly avoided).
- **Misleading Home error (Fix E deferred).** Auth/network failures still render the
  address-blaming message. Tracked in audit §6.
- **Retry latency.** The read retry adds up to ~300 ms (2 × 150 ms) to cold-start
  hydration *only* when the first keychain read throws; the happy path is unaffected.

## Commit

Not committed — left in the working tree for review per instructions.
