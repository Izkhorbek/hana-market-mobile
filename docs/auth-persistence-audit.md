# Auth Persistence Audit

> Read-only investigation. No code changed. Scope: token/user disappearing after
> force-kill + reopen, then Home showing "Mahsulotlarni yuklashda xatolik.
> Manzilni... qayta sozlab ko'ring".

## 1. Executive Summary

**Most likely root cause:** the session is **lost during persistence, then permanently
destroyed by a startup guard** — not because the access token expired.

Two independent async writes hold the session, and **neither is awaited**:

| What | Where persisted | Write path |
| --- | --- | --- |
| `token` / `refreshToken` / `expiresAt` | OS keychain (`secureTokenStore`) | `void secureTokenStore.write(...)` — **fire-and-forget** (`auth-store.ts:170`, `:201`) |
| `isAuthenticated`, `user`, `locationGranted` | AsyncStorage (zustand `persist`) | async, debounced by the persist middleware |

Because the keychain write is fire-and-forget and the AsyncStorage write is a
separate async path, a **force-kill can land one but not the other**. After such a
kill the two stores can disagree:

- AsyncStorage says `isAuthenticated: true` (+ user with location), **but**
- the keychain returns no token (write never completed, **or** a transient Android
  Keystore read error after force-stop).

On the next launch, `hydrateTokensFromVault()` hits this guard
(`modules/Auth/auth-store.ts:391-396`):

```ts
if (s.isAuthenticated && !s.token) {
  useAuthStore.setState({ sessionExpiredOnStart: true })
  s.logout()            // ← calls secureTokenStore.clear()  (auth-store.ts:309)
  s.setHydrated(true)
  return
}
```

`logout()` calls `secureTokenStore.clear()` — so a **transient / partial-write
desync is converted into a permanent wipe of an otherwise-valid vault.** This is
the core defect: the guard is *destructive* on a *recoverable* condition.

Aggravating factor: `secureTokenStore.read()` (`utils/secureTokenStore.ts:104-109`)
**swallows every error and returns an all-null object**, so a transient Android
Keystore failure after force-stop is indistinguishable from a genuinely empty
vault — and feeds the same destructive guard.

- **Is the token deleted or just not rehydrated?** Both happen, in sequence: it is
  *not rehydrated* (missed write or transient read failure), and then it is
  *actively deleted* by `logout()` in the startup guard / interceptor.
- **Does product fetch start before auth hydration?** Navigation is gated
  (`app/index.tsx` waits for `isHydrated`), but the **product query itself has no
  `enabled` gate** (`api/hooks/useProduct.ts:188-207`), so on tab remount / refetch
  it can run with no token → 401. The Home error message then **mis-attributes the
  failure to location** (see §6).

## 2. Storage Map

| Data | Storage | Key | Read location | Write location | Clear location |
| --- | --- | --- | --- | --- | --- |
| accessToken | OS keychain (SecureStore / Keystore) | `hana.auth.tokens.v1` (combined JSON) | `secureTokenStore.read()` → `hydrateTokensFromVault` (`auth-store.ts:354`) | `secureTokenStore.write()` (`auth-store.ts:170`, `:201`, `:373`) — fire-and-forget | `secureTokenStore.clear()` via `logout()` (`auth-store.ts:309`) |
| refreshToken | OS keychain (same blob) | `hana.auth.tokens.v1` | same | same | same |
| expiresAt / refreshTokenExpiresAt | OS keychain (same blob) | `hana.auth.tokens.v1` | same | same | same |
| user (incl. latitude/longitude/search_radius_km/address_name) | AsyncStorage (zustand persist) | `hana-auth-storage` | `onRehydrateStorage` (`auth-store.ts:329`) | persist middleware (`partialize` `auth-store.ts:322-328`) | `logout()` set-null (`auth-store.ts:298-306`) |
| isAuthenticated | AsyncStorage (zustand persist) | `hana-auth-storage` | same | same | same |
| locationGranted | AsyncStorage (zustand persist) | `hana-auth-storage` | same | same | same |
| sessionExpiredOnStart | in-memory only (not persisted) | — | — | `set()` | `clearSessionExpiredOnStart()` |

Note: tokens are deliberately excluded from the AsyncStorage blob by `partialize`
(so they never sit in plaintext). That split is the source of the atomicity gap.

## 3. Startup Timeline

```
App process starts
  → Sentry + global error handlers init (app/_layout.tsx:22-25)
  → RootLayout renders: QueryClientProvider, ChatBootstrap, NotificationBootstrap, <Stack>
  → zustand `persist` rehydrates AsyncStorage blob (user, isAuthenticated, locationGranted)
        onRehydrateStorage callback fires →  void hydrateTokensFromVault(state)   [FIRE-AND-FORGET, async]
  → app/index.tsx renders: isHydrated === false → shows <ActivityIndicator/> (navigation gated here)
  ...
  hydrateTokensFromVault (async):
     1. vault = await secureTokenStore.read()           (utils/secureTokenStore.ts:91) — swallows errors → EMPTY
     2. if legacy tokens in AsyncStorage & vault empty → migrate
     3. else if vault.token → setState({ ...tokens, isAuthenticated: true })
     4. finally:
          a. GUARD: isAuthenticated && !token → sessionExpiredOnStart + logout()(WIPES VAULT) + setHydrated(true) → return
          b. if token locally expired → refreshTokens(); if that fails → logout()(WIPES VAULT) + setHydrated(true)
          c. fetchUser().finally(setHydrated(true))
  → isHydrated becomes true
  → app/index.tsx: isAuthenticated ? Redirect /(tabs)/home : Redirect /(auth)/welcome
  → Home mounts → ProductsList → useInfiniteProductsQuery runs (NO enabled gate)
```

Key point: navigation waits for `isHydrated`, but `isHydrated` is set to `true`
*inside* the same `finally` that may have already wiped the vault (4a/4b). So the
user lands on `/welcome` (if wiped before redirect) **or** on Home with a dead
session (if the wipe happens via the interceptor after Home mounts — see §5).

## 4. Clear / Logout Triggers

Every code path that removes token/user data (all funnel through `logout()` →
`secureTokenStore.clear()` + `queryClient.clear()` + state reset, except the
keychain-only `clear`):

1. **`logout()`** — `auth-store.ts:288-314`. The single destructive primitive
   (chat reset, `queryClient.clear()`, state null-out, `secureTokenStore.clear()`,
   Sentry user detach).
2. **Startup guard** — `auth-store.ts:391-396`. `isAuthenticated && !token` → `logout()`. **← prime suspect.**
3. **Startup locally-expired refresh fail** — `auth-store.ts:408-414`. expired access + failed `refreshTokens()` → `logout()`.
4. **`fetchUser()` 403** — `auth-store.ts:242-246` → `logout()`.
5. **Axios interceptor 401 + refresh fail** — `api/api.ts:138` → `authLogoutSessionExpired()` → `logout()`.
6. **Axios interceptor 401 with no token / already retried** — `api/api.ts:141` → `authLogoutSessionExpired()` → `logout()`.
7. **`authLogoutSessionExpired` bridge** — `auth-store.ts:433-449` (re-entrancy guard + 2s cooldown) → `logout()`.

Confirmed **NOT** clearing auth (verified read-only):
- No `AppState` / background / foreground listeners anywhere.
- No `AsyncStorage.clear()` anywhere.
- `secureTokenStore.clear()` is called **only** from `logout()`.
- `queryClient.clear()` is called **only** from `logout()` (all other call sites are `invalidateQueries`, which is non-destructive).
- Manner-Temperature (`api/services/manner.service.ts`), Guidance/Welcome modals
  (`services/storage/guidanceStorage.ts`, `components/guidance/*`) do **not** touch auth.
- `ChatBootstrap` / `NotificationBootstrap` do not clear auth on mount; they only
  react to `isAuthenticated` flipping to `false` (effect cleanup), i.e. *after* logout.

## 5. Race Conditions Found

1. **Write race (login & refresh) — primary.** `verifyOtp` (`auth-store.ts:170`) and
   `refreshTokens` (`auth-store.ts:201`) persist tokens with `void secureTokenStore.write(...)`
   (fire-and-forget). The matching `isAuthenticated`/user write goes to AsyncStorage
   on a *different* async path. A force-kill between login/refresh and write
   completion leaves the two stores desynced (auth flag persisted, vault not).
2. **Destructive hydration guard — primary.** The desync from (1), or a transient
   keychain read error, trips `auth-store.ts:391-396`, which calls `logout()` and
   **permanently clears the vault**. Recoverable state is destroyed.
3. **Read-failure masquerade.** `secureTokenStore.read()` returns EMPTY on *any*
   thrown error (`utils/secureTokenStore.ts:104-109`). Transient Android Keystore
   unavailability after force-stop → "looks empty" → feeds guard (2). No retry.
4. **Query-before-token race (secondary).** `useInfiniteProductsQuery` has **no
   `enabled` gate** (`api/hooks/useProduct.ts:188-207`). On tab remount/refetch it
   can fire with a null/stale token → 401 → interceptor refresh; if refresh fails
   transiently → `logout()` while the user is already on Home (explains seeing the
   product error *and* being logged out, rather than landing on `/welcome`).
5. **401 logout race — mitigated, not a cause.** Concurrent 401s share one refresh
   (`runSingleFlightRefresh`, `api/api.ts:66-75`) and the bridge has a re-entrancy
   guard + 2s cooldown (`auth-store.ts:433-449`). This part is sound.

## 6. Product Fetch Error Mapping

`components/Lists/ProductsList.tsx:170-187` renders a **single generic error branch**
keyed off React Query's `isError`:

```tsx
if (isError) {
  return (
    <View style={styles.centerBox}>
      {ListHeader}
      <Text ...>
        {t('home.error')}{'\n'}            // "Mahsulotlarni yuklashda xatolik"   (locales/uz.json:51)
        {t('home.retry_set_address')}      // "Manzilni... qayta sozlab ko'ring"  (locales/uz.json:46)
      </Text>
      <TouchableOpacity onPress={() => refetch()}>...</TouchableOpacity>
    </View>
  )
}
```

There is **no error discrimination**. Any failure — auth/session loss, network,
500, or an actual location problem — renders the same address-blaming copy. So when
the real cause is a wiped session (token gone, request 401/unauthorized), the user
is told to "re-set their address," which is misleading and hides the auth root cause.

- Query has no `enabled` gate and always passes coordinates (falls back to Tashkent
  if `user` is null), so it never *waits* for auth/location; it just *fails generically*.
- `home.error` / `home.retry_set_address` strings: `locales/uz.json:51` / `:46`
  (and ru/en equivalents).

## 7. Recommended Fix Plan

Smallest-safe-first. Does not refactor auth, does not change the backend, does not
remove refresh logic.

**Fix A — Harden the keychain read (root of the "looks empty" masquerade).**
`utils/secureTokenStore.read()`: add a small bounded retry on a *thrown* error and
distinguish a genuine empty vault (getItem → `null`) from a transient hardware/
Keystore error. Survives the post-force-stop Keystore unavailability window so the
guard isn't fed a false "empty".

**Fix B — Make token persistence durable on login & refresh (close the write race).**
`await` the vault write in `verifyOtp` (`auth-store.ts:170`) and `refreshTokens`
(`auth-store.ts:201`) instead of fire-and-forget, so the keychain is guaranteed
written before navigation / a possible kill. `verifyOtp` is already awaited by the
caller; the added latency is a single keychain write.

**Fix C — Stop the startup guard from destroying a recoverable vault.**
In `hydrateTokensFromVault`, when the read *failed* (not a genuine empty), do **not**
call `logout()`/`secureTokenStore.clear()`. Preserve the vault so the next launch
(with a healthy Keystore) recovers the session. Only treat a *genuinely empty* vault
as session-end. (Requires Fix A to expose read-failure vs empty.)

**Fix D — Gate the product query on hydration (defensive).**
Add `enabled: isHydrated && (querySettings.enabled ?? true)` inside
`useInfiniteProductsQuery` so it never fires before auth restore on remount/refetch.

**Fix E — Correct the Home error message (no UI-only hiding).**
In `ProductsList`, when the user is unauthenticated after hydration, show a
session/login message instead of the address-blaming copy; keep the location/network
copy for the genuine cases. New i18n keys in `locales/{uz,ru,en}.json`.

**Suggested order / blast radius:** A + B + C fix the data loss (the actual bug).
D + E fix the misleading symptom. A, B, C are the minimum to stop tokens
disappearing; D and E improve correctness of the failure UX.

---

### Appendix — files inspected

- `modules/Auth/auth-store.ts` (store, hydration, guard, bridge registration)
- `utils/secureTokenStore.ts` (keychain vault)
- `api/api.ts` (axios interceptors, single-flight refresh)
- `api/auth-bridge.ts` (DI bridge)
- `app/index.tsx` (hydration/navigation gate)
- `app/_layout.tsx` (provider tree)
- `api/queryClient.ts` (React Query defaults)
- `api/hooks/useProduct.ts` (`useInfiniteProductsQuery`)
- `components/Lists/ProductsList.tsx` (Home product list + error UI)
- `components/providers/ChatBootstrap.tsx`, `components/providers/NotificationBootstrap.tsx`
- `locales/uz.json` (error strings)
- `api/services/manner.service.ts`, `services/storage/guidanceStorage.ts`, `components/guidance/*` (recent features — cleared)
