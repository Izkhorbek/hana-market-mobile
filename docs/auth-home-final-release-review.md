# Auth Single-Source + Home Error — Final Release Review

Reviewer role: Senior React Native QA. Scope: pre-release sign-off for the auth
single-source-of-truth fix and the Home error-message fix. No code was changed
during this review (no clear blocker found).

## Verification

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** (exit 0, no output) |
| `npx eslint` on all 7 changed source files | **PASS** (no errors; only the benign `MODULE_TYPELESS_PACKAGE_JSON` warning) |

Files linted: `utils/secureTokenStore.ts`, `modules/Auth/auth-store.ts`,
`api/api.ts`, `components/providers/AuthGuard.tsx`, `app/_layout.tsx`,
`components/Lists/ProductsList.tsx`, `utils/apiError.ts`.

## Checklist results

| # | Check | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | No raw token logging | ✅ Pass | `logger.normalizeError` only reads `message`/`stack`; axios errors always have `.message`, so the `JSON.stringify(err)` fallback (which would include `config.data` = the refresh-token body) never fires. Interceptor `extra` carries only `method/url/status/response_message`. No `Authorization`/headers serialization in `logger.ts`. |
| 2 | `isAuthenticated` not persisted | ✅ Pass | `partialize` returns only `{ user, locationGranted }` (auth-store.ts:349). |
| 3 | SecureStore is the auth source of truth | ✅ Pass | `hydrateTokensFromVault` derives the session from the vault's refresh token; `isAuthenticated` starts `false` and is set only after the vault read (auth-store.ts:388-462). |
| 4 | `verifyOtp` + `refreshTokens` await vault writes | ✅ Pass | `await secureTokenStore.write(...)` at auth-store.ts:173 and :225; `write()` now returns `boolean`. |
| 5 | 401 interceptor logs out only on invalid RT, not transient | ✅ Pass | `refreshTokens` returns `null` only on 400/401, **throws** on transient (auth-store.ts:196-204). Interceptor logs out on `null`, keeps session on throw (api.ts:127-143). |
| 6 | AuthGuard cannot redirect during hydration | ✅ Pass | `if (!isHydrated) return` before any redirect (AuthGuard.tsx:29). |
| 7 | AuthGuard does not redirect from auth pages | ✅ Pass | `inAuthGroup = segments[0] === '(auth)'`; redirect skipped when in `(auth)` (AuthGuard.tsx:31-33). `app/(auth)/welcome.tsx` confirmed present. |
| 8 | Product query gated on hydration + auth | ✅ Pass | `enabled: isHydrated && isAuthenticated` (ProductsList.tsx:70-71, 93-94). |
| 9 | Home classifier doesn't mislabel auth/network/server as location | ✅ Pass | `classifyGeoApiError` orders network → auth(401/403) → server(≥500) → location(400/404) → unknown (apiError.ts:20-35). |
| 10 | Locale keys exist in uz/ru/en | ✅ Pass | `home.error_auth/network/server/location/generic` present in all three (en.json:53-57, ru.json:53-57, uz.json:53-57). |
| 11 | Logout still clears vault + user cache | ✅ Pass | `logout()` nulls auth state, `queryClient.clear()`, `useChatStore.reset()`, `secureTokenStore.clear()`, `setSentryUser(null)` (auth-store.ts:309-335). |
| 12 | No regressions to Manner Temperature / Guidance modals | ✅ Pass | `WelcomeModal.tsx` and `MannerReviewModal.tsx` reference none of `isAuthenticated`/`isHydrated`/product query/classifier; they mount under the already-authenticated `(tabs)` tree. |

## Blockers

**None.** The two target bugs (force-kill token loss; misleading Home error) are
correctly addressed, and both verification gates pass.

## High risks

**None.**

## Medium risks

- **M1 — Interceptor refresh gate keys on the access token, not the refresh
  token.** If startup hydration keeps the session after a *transient* refresh
  failure, the in-memory access token can be `null` while `isAuthenticated` is
  `true`. The next request sends no `Authorization` header → 401 → the interceptor's
  refresh branch is skipped (`getAuthToken()` is falsy) → it falls to
  `authLogoutSessionExpired()`. Result: a **spurious logout** without ever
  re-validating the still-valid refresh token. Narrow trigger (expired/absent
  access token + transient refresh at boot + a later reachable 401), self-correcting
  (user re-logs in), no data loss. *Recommended fast-follow:* let the interceptor
  attempt refresh when a refresh token exists even if the access token is absent.

- **M2 — Logout clear is not durable / RT not invalidated server-side.** `logout()`
  uses fire-and-forget `void secureTokenStore.clear()` and does not call the
  backend `/auth/logout`. A force-kill in the (very short) window before the
  keychain delete flushes would leave a still-valid refresh token in the vault, so
  the next launch could silently restore the session. This is an asymmetry with the
  now-durable write path and a small gap in the single-source model. Low real-world
  likelihood (keychain deletes are fast). *Recommended fast-follow:* `await` the
  clear in a logout path, and/or invalidate the RT via the backend logout call.

## Low risks

- **L1 — Classifier maps every 400/404 on `/product/all` to "location".** A
  non-location validation 400 (e.g. a bad filter param) would show the location
  message. The endpoint is geo-gated and the copy is soft ("Try updating your
  location"), so impact is minor. Documented in the fix report.
- **L2 — Logger fallback could in theory serialize a token.** `normalizeError`'s
  `JSON.stringify(err)` branch (which would include `error.config.data`) is only
  reached for non-Error objects lacking a `.message`. Unreachable for axios errors
  today, but a defensive `config` strip before logging would harden it.
- **L3 — Extra refresh round-trip at boot.** Background `fetchUser()` on a stale
  access token can trigger one interceptor refresh; handled, never forces logout.
- **L4 — Double redirect on cold start.** For a logged-out user, both `app/index.tsx`
  (`<Redirect>`) and `AuthGuard` may target `/(auth)/welcome`. Idempotent (same
  route); watch for a one-frame flicker on low-end devices during QA.
- **L5 — 403 on profile fetch forces logout** (auth-store.ts:263-267). Unusual for
  this backend; pre-existing behavior, unchanged.

## Release recommendation

**GO / ship.** The release fixes the production force-kill data-loss bug and the
misleading Home error message; all 12 review checks pass and both build gates are
green. No blockers or high risks. Track **M1** and **M2** as fast-follow items —
both are narrow, self-correcting, and do not cause data corruption. Prioritize the
device QA below (especially the force-kill and offline scenarios) before promoting
the build to production.

## Manual QA checklist

Run on a **physical Android device** (the original failure is timing-sensitive).

Auth single-source:
1. Login → force-kill 5× → still logged in each relaunch; Home loads products.
2. Login → force-kill while Home is loading → still logged in.
3. Login → force-kill immediately after OTP success → logged in (or a clean Login), and the **next** login works (no corrupted session).
4. Expire/clear the refresh token → reopen → Login page + "session expired" alert.
5. Missing token after hydration → Login page, not a broken Home.
6. Confirm no `/product/all` request fires before `isHydrated` (products query disabled until hydrated + authenticated).
7. Logout button → vault + user cache cleared → routed to Login; relaunch stays logged out.
8. Access token expired + refresh token valid → silent refresh; app stays logged in, no session-expired dialog.
9. Trigger multiple simultaneous 401s → exactly one `/auth/refresh` call (single-flight); all requests retried.
10. Inspect logcat/telemetry for `AUTH_*` codes → confirm **no raw token values** ever appear; `TOKEN_VAULT_WRITE_FAILED` absent on the happy path.
11. **M1 probe:** with an expired access token, put the device in airplane mode, cold-start, then re-enable network and pull-to-refresh → confirm the app refreshes and stays logged in (does not bounce to Login).
12. **M2 probe:** Logout, then immediately force-kill and relaunch → confirm the app is logged out (not silently restored).

Home error message:
13. Airplane mode → open Home → "No internet connection…" (not the location message).
14. Force a 5xx from the products endpoint → "Server error…".
15. Force a 401 that reaches the list → "Your session has ended…" (and AuthGuard routes to Login).
16. 400/404 from `/product/all` → location message.
17. Repeat 13–16 in uz / ru / en → correct localized string each time; layout unchanged; Retry button refetches.

Regression spot-checks:
18. Guidance WelcomeModal still appears once for a fresh authenticated user and never stacks over the report/category sheets.
19. Manner Temperature / review modal still opens and submits normally.

---
*No commit performed, per instructions.*
</content>
