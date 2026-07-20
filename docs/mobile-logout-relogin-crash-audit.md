# Logout → Re-login crash audit (GlobalErrorBoundary fallback)

**Date:** 2026-07-20
**Symptom:** After logout followed by a second login in the same process, the app sometimes renders the
`GlobalErrorBoundary` fallback ("Nimadir xato ketdi" / Retry / `@hana_market_admin`).
**Scope:** Audit + **Phase 0 diagnostics implemented** (see §13). No behavioural fix yet — Phase 1
and Phase 2 remain unimplemented, deliberately.
**Screenshot:** `issues/Issue_2026-07-20_07-46-57.jpg`

---

## 1. Root cause verdict

> ### ✅ SUPERSEDED — ROOT CAUSE PROVEN. See **§14**.
>
> The Phase 0 diagnostics (§13) did their job: they captured the real exception, which is
> **`Error: Attempted to navigate before mounting the Root Layout component`**, thrown by
> `AuthGuard` calling `router.replace()` before `<Stack>` had registered its navigator.
>
> **None of the §4 candidates was the cause.** They remain open as latent defects worth fixing on
> their own merit, but they are no longer the explanation for this crash. Read §4 as a backlog, not
> as a diagnosis.
>
> The verdict below is preserved as the state of knowledge *before* instrumentation — and because
> reporting-path defects R1–R5 are real, were what made the crash invisible in the first place, and
> are only partially fixed (§13).

### Original verdict (pre-diagnostics): **NOT YET PROVEN — and it cannot be proven from the field data we currently collect.**

The primary finding of this audit is not a specific line of code. It is that **this crash is
structurally unreportable in a production build**. Five independent defects in the reporting path
conspire so that a React render error is either never transmitted, transmitted without the
information needed to identify it, or suppressed entirely:

| # | File:line | Defect | Effect on this investigation |
|---|---|---|---|
| R1 | `app/_layout.tsx:40` vs `:74` | `GlobalErrorBoundary` wraps `sentryWrap(RootLayout)`, so the class boundary is **above** Sentry's HOC | Sentry never receives the exception. `captureException` is never called anywhere for render errors. |
| R2 | `utils/logger.ts:193-199` | `logger` deliberately emits only `addSentryBreadcrumb`, never `captureException` (comment at `:193`) | A breadcrumb only surfaces attached to some *later* Sentry event. On its own it is unretrievable. |
| R3 | `utils/logger.ts:185-189` | The `console.error` mirror is inside `if (__DEV__)` | A production fatal is completely silent on-device. Nothing in logcat / Console.app. |
| R4 | `utils/logger.ts:119-132` | Dedupe signature is `level\|code\|message` — **stack and componentStack are excluded**, window 30 s | The boundary's own "Retry" re-renders the same broken tree; every repeat within 30 s is dropped. Two different crash sites with the same message collapse into one report. |
| R5 | `utils/logger.ts:98-101` + `types/index.ts:56` | `normalizeError` only falls back to `err.name` when `message` is empty; `MobileLogDto` has no `name` field | We cannot distinguish `TypeError` from the react-navigation `Error` (see §4, C1) — which is exactly the discriminator we need. |

So the **only** channel carrying this crash is a single fire-and-forget `POST /telemetry/log`
(`utils/logger.ts:159-167`), with no retry and no queue — and that POST has its own failure mode
described in §4/A3.

Everything below is ranked evidence, not a verdict. **Do not ship a fix based on this document
alone.** §7 specifies the minimal, temporary, PII-free diagnostics that will convert one of the
candidates in §4 into a proven root cause; §6 is the repro plan to trigger it.

**Secondary verdict (this one IS proven, by code reading):** even once the crash is identified, the
boundary's `Retry` button cannot recover from it — see §7.

---

## 2. Exact exception and stack

**Not available.** For the reasons in §1 (R1–R5), no exception object, name, message, or component
stack for this crash exists in Sentry, in device logs, or reliably in backend telemetry.

What *would* have been sent had the POST succeeded (`utils/logger.ts:141-158`):

```
level:   "fatal"
code:    "REACT_RENDER_ERROR"
message: err.message           (truncated to 2000)
stack:   err.stack             (truncated to 8000)
screen:  currentScreen         (whatever logger.setScreen last recorded)
extra:   { componentStack }    (see below)
```

Note `extra` is capped at 4 KB serialized (`utils/logger.ts:37`, `:52-66`). A React 19
`componentStack` for a tree this deep routinely exceeds that, in which case the whole `extra` object
is replaced by `{_truncated: true, _original_size, snapshot: json.slice(0, 3896)}`. So even a
successful report may carry only a head-truncated component stack.

**Action:** query the backend `telemetry/log` table for `code = 'REACT_RENDER_ERROR'` and
`level = 'fatal'` over the last 30 days before adding any instrumentation. If rows exist, this audit
short-circuits and §4's candidate ranking can be resolved immediately. If the table is empty despite
user reports, R1–R5 are confirmed empirically and §7's diagnostics are required.

---

## 3. Exact logout → re-login sequence

### 3A. Logout (user taps Profile → Logout)

Entry point `app/(tabs)/profile.tsx:76-81`:

```ts
onPress: async () => {
  await logout()
  router.replace('/(auth)/welcome')
}
```

`logout()` — `modules/Auth/auth-store.ts:318-368`, in exact order:

| Step | Line | Action | Sync? |
|---|---|---|---|
| L1 | `:321` | Capture `accessToken` from memory | sync |
| L2 | `:329` | `void authService.logout(accessToken)` — fire-and-forget server revoke (`_skipAuthRefresh`) | async, unawaited |
| L3 | `:335` | `useChatStore.getState().reset()` | sync |
| L3a | `chat-store.ts:836-843` | unsubscribe SignalR listeners, clear typing timers, `joinedRooms`, `joinPromises`, `connectPromise`, `roomAccessOrder`, `locallyReadRooms` | sync |
| L3b | `chat-store.ts:849` | `signalRService.disconnect()` — **unawaited, uncaught** | async |
| L3c | `chat-store.ts:854-866` | `set({ chatList: [], messages: {}, onlineUsers: {}, typingUsers: {}, unreadCount: 0, connectionState: Disconnected, ... })` | sync |
| L4 | `:340` | `queryClient.clear()` — **wipes the entire React Query cache while every tab screen is still mounted** | sync |
| L5 | `:344-352` | `set({ token: null, refreshToken: null, user: null, isAuthenticated: false, locationGranted: false })` | sync |
| L6 | `:356` | `setSentryUser(null)` | sync |
| L7 | `:362` | `await secureTokenStore.clear()` — **SecureStore / iOS Keychain, tens of ms** | **awaited** |
| L8 | `profile.tsx:80` | `router.replace('/(auth)/welcome')` | — |
| L9 | `AuthGuard.tsx:33` | effect fires on `isAuthenticated: false` → **a second** `router.replace('/(auth)/welcome')` | — |

**The window.** Between L4/L5 and L8 the app is in a fully logged-out state with the `(tabs)` subtree
still mounted and rendering. The window's length is dominated by L7, an OS keychain write. This is the
single most important structural fact in this document.

**What fires inside that window:**

* `NotificationBootstrap` (`components/providers/NotificationBootstrap.tsx:96-110`) re-runs on
  `isAuthenticated: false` and calls `notificationService.deactivateToken(...)` — an **authenticated
  request issued after the token was cleared at L5**. Guaranteed 401.
* `useUnreadCountQuery` (`api/hooks/useChat.ts:89-97`) — `refetchInterval: 30000`, `retry: 1`,
  `retryDelay: 3000`. Mounted app-wide by `ChatBootstrap`. Any in-flight poll 401s, then **retries
  3 seconds later**, long after the vault is wiped.
* Ungated queries on mounted tab screens refetch immediately after L4 (`queryClient.clear()`
  invalidates and mounted observers refetch): `useProductMapMarkersQuery`
  (`api/hooks/useProduct.ts:52-56`, consumed ungated at `app/(tabs)/map.tsx:48`).

**Each of those 401s lands here** — `api/api.ts:130-165`:

```ts
if (responseStatus === 401 && !_retried && !_skipAuthRefresh &&
    (getAuthToken() || hasRefreshableSession())) { ...refresh... }
else if (responseStatus === 401) {
  authLogoutSessionExpired()          // api/api.ts:164
}
```

After L5, `getAuthToken()` is `null` and `hasRefreshableSession()` is `false`
(`auth-store.ts:501-504` requires `!!s.refreshToken`). So control falls to `:164` →
`authLogoutSessionExpired()` (`auth-store.ts:508-524`) → sets `sessionExpiredOnStart: true` and calls
`logout()` **re-entrantly, while the first `logout()` is still awaiting L7**.

### 3B. Re-login (`app/(auth)/auth.tsx:246-281` → `verifyOtp`)

`verifyOtp()` — `modules/Auth/auth-store.ts:155-192`:

| Step | Line | Action | Sync? |
|---|---|---|---|
| V1 | `:156` | `POST /auth/verify-otp` | async |
| V2 | `:158-165` | extract `X-Access-Token` etc.; throw if absent | sync |
| V3 | `:167-175` | `set({ token, refreshToken, isAuthenticated: true, user: hasValidUserId(userData) ? userData : get().user })` | sync |
| V4 | `:182-187` | `await secureTokenStore.write({...})` — **awaited keychain write** | **awaited** |
| V5 | `:189-191` | `if (!hasValidUserId(userData)) await get().fetchUser()` — network round trip | **awaited** |
| V6 | `auth.tsx:252-268` | branch on `user.username` / `user.latitude` → `router.replace('/(tabs)/home')` | — |

**The second window.** At V3, `isAuthenticated` flips to `true`. But `get().user` is `null` — logout
set it so at L5. So unless the verify-otp response body carries a valid user, the app spends the whole
of V4 + V5 (a keychain write plus a full network round-trip) in the state:

> **`isAuthenticated === true` && `user === null`**

This state does not exist on a first login after a fresh install in the same way, because there the
user has just been through hydration; it is specific to a re-login in a live process. **This is the
strongest structural difference between "first login" and "login again", and it is the state in which
every `isAuthenticated`-gated query fires with no user.**

If V5's `fetchUser()` fails on a network error, it returns silently (`auth-store.ts:279-282` logs and
returns — correctly, it must not log out on a blip). `verifyOtp` then resolves, `loggedInUser` is
`null` at `auth.tsx:252`, both guards at `:253` and `:261` are skipped, and
**`router.replace('/(tabs)/home')` executes with `user === null` and `isAuthenticated === true`.**
That state is then durable, not transient.

**What re-runs on V3:**

* `ChatBootstrap` → `useMyChatQuery` + `useUnreadCountQuery` fire (gated on `isAuthenticated` only).
* `useSignalRConnection` (`api/hooks/useSignalR.ts:26-31`) → `connect()`.
* `NotificationBootstrap` → permission + `getDevicePushTokenAsync` + `registerToken`.
* `VersionCheckBootstrap` — **does not re-run**: `versionCheckStarted` is a module-level flag
  (`VersionCheckBootstrap.tsx:14`), correct by design.

---

## 4. Ranked candidates

None is proven. Ordered by (reachability on this exact path) × (severity).

### A. Session-teardown races — **proven mechanisms, crash impact unproven**

**A1 — Re-entrant logout from ungated 401s.** Described in §3A. `authLogoutSessionExpired` is
deduped by the module flag `sessionExpiredHandled` (`auth-store.ts:507-524`) with a 2 s reset, so it
does not loop, but it does re-enter `logout()` → a second `queryClient.clear()` + `chatStore.reset()`
+ `secureTokenStore.clear()` concurrent with the first. **Files:** `api/api.ts:162-165`,
`modules/Auth/auth-store.ts:508-524`, `components/providers/NotificationBootstrap.tsx:99-104`,
`api/hooks/useChat.ts:94-96`.

**A2 — `secureTokenStore.clear()` / `write()` race.** No mutex, no generation counter
(`utils/secureTokenStore.ts:91-155`). Logout awaits `clear()` at `auth-store.ts:362` while a
concurrent `refreshTokens()` awaits `write()` at `:234`. If the write lands last, a valid refresh
token **survives a completed logout** on disk and `hydrateTokensFromVault` restores it next launch.
The single-flight guard in `api/api.ts:69-78` serializes refreshes against each other, not against
logout. This is a correctness bug in its own right regardless of the crash.

**A3 — Telemetry 401 logs the user out.** `telemetryService.log` sets `_skipAuthRefresh: true`
(`api/services/telemetry.service.ts:24`) with a comment claiming it prevents a "refresh / logout
loop". It prevents the *refresh* only: the `else if (responseStatus === 401)` at `api/api.ts:162`
still runs `authLogoutSessionExpired()`. **A background log POST can therefore log the user out.**
Directly relevant here: the crash report *itself* travels this path, at the exact moment the token is
most likely to be stale.

### B. `isAuthenticated && user === null` consequences — **most likely crash family**

Established in §3B as reachable and, on a failed `fetchUser`, durable.

**B1 — `app/(tabs)/chat.tsx:31-45`, `transformChatItem`.** Six unguarded dereferences:

```ts
const isBuyer = item.buyer.id === currentUserId              // :31
const otherUser = isBuyer ? item.seller : item.buyer         // :33
name: otherUser.username || i18n.t('chat_room.unknown_user') // :38
thumbnail: item.product.image_url || undefined               // :41
```

`ChatRoomDto` declares `buyer`/`seller`/`product` as required (`types/index.ts:240-251`), so nothing
validates them. Rows enter `chatList` unvalidated from two SignalR paths (`chat-store.ts:973`,
`:1060` — the latter only checks `typeof room.id !== 'number'`). Plus `chat.tsx:129`/`:132`
(`chat.seller.id`, `chat.buyer.id` inside `useMemo`). **Note the asymmetry that makes this fit the
symptom:** `chat-store.ts:321` guards with `myId && incoming.buyer.id === myId` — while `myId` is
`undefined` (the logged-out and the re-login window) the deref short-circuits and a malformed room is
**silently accepted** into `chatList`; it detonates only once `user` is set. That is a logout-plants /
re-login-detonates shape. **Requires the user to open the Chat tab**, which is why it would be
"sometimes", not always.

**B2 — `app/search.tsx:101-104`.**

```ts
data?.pages.flatMap((page) => page.data?.data?.items ?? []) ?? []
```

`page.data` is not optional-chained — compare the correct `p.data?.data?.items` at
`components/Lists/ProductsList.tsx:108`. Compounding: this `useInfiniteProductsQuery` call
(`search.tsx:89-97`) passes **no `querySettings`**, so unlike `ProductsList.tsx:99`
(`enabled: isHydrated && isAuthenticated`) it is completely ungated and refetches during the logout
window.

**B3 — `api/hooks/useProduct.ts:227`.** `getNextPageParam: (lastPage) => { const paged = lastPage.data?.data`
— `lastPage` itself unguarded, vs the correct `lastPage?.data` at `api/hooks/useChat.ts:69`. This
executes inside React Query's data resolution and surfaces as a render-phase throw, not a caught
query error.

**B4 — `modules/Chat/ChatListItem.tsx:104`.** `{chat.name.charAt(0).toUpperCase()}` — reached only
when `chat.avatar` is falsy (`:92`), and `name` is downstream of B1's fallback.

**B5 — `app/(settings)/my-complaint.tsx:40`.** `data?.pages.flatMap(...)` — same shape as B2, throws
only if `data` is truthy while `pages` is `undefined`.

**Ruled out** (verified guarded, listed so they are not re-investigated):
`app/chat/[id].tsx:748-756` (guarded by `if (!messagesData?.pages) return []`, and `page?.data?.messages`);
`components/Lists/ProductsList.tsx:106` (`data?.pages` short-circuits the whole chain when `data` is
`undefined`, which is exactly the post-`clear()` state); `app/chat/[id].tsx:538-542`, `:820`,
`:898-915` (all early-return on `!currentUserId`); `map.tsx`, `(tabs)/home.tsx`, `(tabs)/_layout.tsx`,
`modules/Profile/*`, `ProfilePageHeader`, `HomeHeader` (all optional-chained with defaults);
`hooks/useColor.ts`, `hooks/use-theme-colors.ts` (no context, cannot throw);
`constants/localization.ts` + `hooks/use-translation.ts` (i18n init is synchronous at
`app/_layout.tsx:9`, `fallbackLng` set, missing keys return the key — cannot throw).

### C. Hooks that throw `Error` rather than returning undefined

**C1 — `app/(tabs)/profile.tsx:45`, `useBottomTabBarHeight()`.** Confirmed throwing implementation
(`node_modules/@react-navigation/bottom-tabs/lib/module/utils/useBottomTabBarHeight.js`):

```js
if (height === undefined) throw new Error("Couldn't find the bottom tab bar height. ...")
```

Aggravated by `profile.tsx:51` — `const { isAuthenticated, user } = useAuthStore()` with **no
selector**, the only such subscription in the tab tree. Logout's single `set()` at
`auth-store.ts:344` therefore forces a full re-render of `ProfilePage` — re-invoking line 45 — while
`router.replace` at `:80` has not yet run (it is behind the awaited keychain clear, L7).

**I could not construct a render where `ProfilePage` commits without a `BottomTabView` ancestor**, and
`(tabs)/_layout.tsx` renders `<Tabs>` unconditionally with no auth gate, so the provider cannot vanish
mid-render. Ranked as the top *hardening* target, not a confirmed reproduction. **Crucially, this
throws an `Error`, not a `TypeError` — which is precisely the discriminator that defect R5 destroys.**

### D. SignalR singleton state surviving the session boundary

Not a boundary-visible crash (`@microsoft/signalr` v10 try/catches client-method invocation), but
listed because it corrupts session 2 and would confound any repro:

* **D1 — orphan connect resurrects `Connected`.** If `reset()` runs while the connect IIFE is parked
  on `await signalRService.connect()` (`chat-store.ts:276-293`), the orphan later executes
  `set({ connectionState: Connected })` at `:281-284` **after** logout. On re-login, `connect()` hits
  the guard at `:264` (`state.connectionState === Connected`) and **returns immediately** —
  `_setupEventListeners()` never runs, the socket is never built. Chat is silently dead for the whole
  second session. The guard reads store state, never `signalRService.getConnectionState()`
  (`signalr.service.ts:255-257`), so the two can never re-sync.
* **D2 — `doConnect` overwrites `this.connection` without stopping the old one**
  (`signalr.service.ts:183`), combined with the unawaited `disconnect()` at `chat-store.ts:849`. An
  old-session socket can survive logout holding the previous user's token and, because `.on` handlers
  close over the *shared mutable* listener arrays (`:463-524`), feed the new session's listeners.
* **D3 — uncancellable reconnect timer.** `setTimeout(() => this.connect(), this.reconnectInterval)`
  at `signalr.service.ts:565`; the handle is never stored. Post-logout it throws
  `'No auth token available for SignalR connection'` at `:179` → unhandled rejection, and can leave
  `this.connectPromise` non-null across the session boundary (`:164`) so a store `connect()` landing
  in that window adopts a **rejected** promise from the dead session.
* **D4 — `chat-store.ts:932`** is the file's only unguarded `state.messages[chatRoomId].map`
  (every other of the 14 sites uses `?? []`). Currently unreachable — the index is derived in the same
  synchronous tick at `:914` — but one `await` away from `Cannot read property 'map' of undefined`.
* **D5 — `chat-store.ts:1005`, `:1013`** (`_handleUserStatusChanged`, `_handleUserTyping`) do no
  payload null-check, unlike the other four handlers.

### E. Stale flags across the session boundary

`sessionExpiredOnStart` is set to `true` by A1's re-entrant logout and is cleared only by
`clearSessionExpiredOnStart()` in `app/index.tsx:16` or by a successful `fetchUser`
(`auth-store.ts:243`). If re-login takes the `hasValidUserId(userData) === true` branch at V5,
`fetchUser` is skipped and the flag survives into the new session, firing a spurious
"session expired" Alert on a later `app/index` mount. Not a crash; will confuse repro reports.

---

## 5. Files involved

**Reporting path (blocks diagnosis):** `components/providers/GlobalErrorBoundary.tsx`,
`utils/logger.ts`, `utils/sentry.ts`, `api/services/telemetry.service.ts`, `app/_layout.tsx`.

**Teardown / setup:** `modules/Auth/auth-store.ts`, `api/api.ts`, `api/auth-bridge.ts`,
`utils/secureTokenStore.ts`, `api/queryClient.ts`, `components/providers/AuthGuard.tsx`,
`app/index.tsx`, `app/(auth)/auth.tsx`, `app/(tabs)/profile.tsx`.

**Bootstraps:** `components/providers/ChatBootstrap.tsx`, `NotificationBootstrap.tsx`,
`VersionCheckBootstrap.tsx`.

**Realtime:** `modules/Chat/chat-store.ts`, `api/services/signalr.service.ts`,
`api/hooks/useSignalR.ts`.

**Candidate crash sites:** `app/(tabs)/chat.tsx`, `modules/Chat/ChatListItem.tsx`, `app/search.tsx`,
`api/hooks/useProduct.ts`, `app/(settings)/my-complaint.tsx`.

---

## 6. Why it affects both iOS and Android

The mechanism is platform-agnostic; the platforms differ only in how wide they open the window.

* **The races are JS-level.** L4→L8 (§3A) and V3→V6 (§3B) are ordering properties of
  `modules/Auth/auth-store.ts`, identical on both platforms.
* **What differs is L7 / V4 duration.** Both awaits are `expo-secure-store` calls. iOS Keychain
  operations (`AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`) are typically slower than Android's
  EncryptedSharedPreferences, so **iOS should reproduce more often**, not exclusively. A materially
  higher iOS rate is a *prediction of this model*, not evidence against it.
* `expo-notifications` device-token acquisition (APNS vs FCM) also differs in latency, shifting
  A1's 401 timing.

**Do not treat this as platform-specific.** If it reproduces on both, that is consistent with — and
expected from — every candidate in §4.

---

## 7. `GlobalErrorBoundary` audit

**Does Retry reset the subtree correctly? Partially — and not in a way that recovers this crash.**

`handleReset` (`GlobalErrorBoundary.tsx:71-73`) sets `{hasError: false, error: undefined}`. Because
the fallback `<View>` replaced `this.props.children` entirely, React unmounts the fallback and mounts
the children subtree fresh. So component state *is* reset. But:

* **`queryClient` is a module singleton** (`api/queryClient.ts:4`) — the cache survives Retry.
* **`useAuthStore` / `useChatStore` are module singletons** — `user: null` + `isAuthenticated: true`,
  a poisoned `chatList`, and `connectionState: Connected` (D1) all survive Retry.
* **`signalRService` is a module singleton** (`signalr.service.ts:577`) — survives Retry.

So if the crash originates in singleton state — which every candidate in §4B and §4D does — **Retry
re-renders the same broken tree and re-crashes immediately.** This exactly matches a sticky error
screen that a user cannot escape, and it is why the user perceives the failure as terminal.

Then R4 (§1) applies: the second crash carries the same `level|code|message` signature, so it is
**dropped by the 30-second dedupe**. The user may tap Retry five times and generate exactly one
telemetry row — or zero, if the first POST 401'd.

**Does the boundary retain stale error state across logout/login?** Yes. There are no `resetKeys`, no
reset on route change, and no reset on auth-state change. Once `hasError` is true it stays true until
the user taps Retry or kills the app. A crash that occurs *during logout* therefore presents to the
user as a screen they are still looking at when they next try to log in — **which may be the entire
explanation for the "after login again" framing in the bug report.** Worth confirming in repro
(§8, step 5): note whether the fallback appears at the moment of logout rather than after re-login.

**The boundary is otherwise correct and must not be weakened.** It reads i18n from the i18next
singleton rather than React context (`:47-50`) precisely so it survives an i18n-consumer crash;
`handleContact` catches (`:77`). Do not add a try/catch around children, do not auto-retry, do not
remove it.

---

## 8. Reproduction plan

Build: `npm run build:android:preview` (APP_ENV=staging) — **plus the §9 diagnostics**, which are
required because a stock production build cannot report this (§1).

**Baseline run**

1. Uninstall. Clean install. Launch.
2. Log in. Wait for Home to fully populate (product list rendered, not skeleton).
3. **Visit every tab: Home → Map → Chat → Profile.** This matters: `(tabs)` screens are lazy, and B1
   only exists once Chat has mounted.
4. Open one chat room, send one message, go back. Confirm SignalR connected.
5. Profile → Logout. **Record the exact moment the fallback appears, if it does** (see §7).
6. Log in again with the same account.
7. After landing on Home, **navigate to the Chat tab** — B1 requires it.
8. Record: screen at crash, seconds since logout, and the `AUTH_DIAG` lines from §9.

**Variants** — run each 5× and record the hit rate:

| # | Variant | Targets |
|---|---|---|
| V1 | Chat tab open at the moment of logout | B1, D1 |
| V2 | Chat never opened in session 1 | isolates B1 |
| V3 | Search screen open at logout (`app/search.tsx` ungated) | B2 |
| V4 | Network throttled to 2G / high latency (Charles or Android emulator "GPRS") for the OTP step | V5 `fetchUser` failure → durable `user === null` |
| V5 | Airplane mode ON between logout and login; re-enable just before OTP | A1, A3, V5 failure |
| V6 | Force-kill the app between logout and login | should **not** reproduce — if it does, the cause is disk state (A2), not an in-process race |
| V7 | Logout → wait 5 s (past `retryDelay: 3000`) → login | isolates the `UNREAD_COUNT` retry (A1) |
| V8 | Logout → login within 2 s | targets the `sessionExpiredHandled` 2 s window (`auth-store.ts:523`) |
| V9 | Second account, different device | rules out account-specific malformed DTOs |

**V4 and V6 are the two highest-value runs.** V4 targets the durable
`isAuthenticated && user === null` state, the single most suspicious condition in this audit. V6 is
the discriminator between an in-process race and disk state.

---

## 9. Smallest safe fix plan

### Phase 0 — diagnostics only (do this first; nothing else ships until §2 has an answer)

**D-1. Make the boundary self-describing.** In `GlobalErrorBoundary.componentDidCatch`, extend the
existing `logger.fatal` call — do not replace it:

```ts
extra: {
  errorName: error?.name,                       // ← R5: the TypeError/Error discriminator
  componentStack: info.componentStack?.slice(0, 2000),
  isAuthenticated, isHydrated,
  hasUser: !!user,                              // BOOLEAN ONLY — never the user object
  segments: segments.join('/'),                 // route, no params
  authPhase,                                    // see D-3
}
```

Read auth state via `useAuthStore.getState()` (safe in a class component; it is a singleton).
**PII rule: booleans and enums only. Never a token, OTP, phone number, user id, username, or the
`user` object.**

**D-2. Break the dedupe for fatals.** In `utils/logger.ts:181`, skip `shouldDedupe` when
`level === 'fatal'`, or include a hash of the stack in the signature. Without this, Retry-loop
crashes are invisible.

**D-3. Add a transition marker.** A module-level `authPhase: 'idle' | 'logging-out' | 'logging-in'`
in `auth-store.ts`, set at the top of `logout()` / `verifyOtp()` and cleared in a `finally`. Included
in D-1. This is the field that will tell us which window (§3A or §3B) the crash lands in.

**D-4. Restore a production console line for fatals** (`utils/logger.ts:185-189`) so the crash is
visible in logcat / Console.app during repro. Revert before the next store build.

**D-5. Bypass telemetry's own failure mode for the duration of the investigation.** Guard
`api/api.ts:162` with `if (isTelemetryCall) return Promise.reject(error)` before the 401 block. This
is A3's fix and is safe to keep permanently — see below.

### Phase 1 — fixes that are safe and correct regardless of what §2 turns out to be

These do not depend on the root cause and each stands on its own merit:

* **F-1 (A3).** Ship D-5 permanently. A background log POST must never log a user out.
  *One line, `api/api.ts:162`.*
* **F-2 (A1).** In `logout()`, cancel React Query work before clearing:
  `queryClient.cancelQueries()` then `queryClient.removeQueries()` in place of / before
  `queryClient.clear()` at `auth-store.ts:340`, so mounted observers do not refetch into a cleared
  cache with a null token.
* **F-3 (A1).** Gate `notificationService.deactivateToken` on a token still being present, or capture
  the token before L5 as `logout()` already does for `authService.logout` at `:321`.
  *`NotificationBootstrap.tsx:99-104`.*
* **F-4 (B2/B3).** Add the missing optional chains: `page?.data` (`search.tsx:103`),
  `lastPage?.data` (`useProduct.ts:227`), and `enabled: isHydrated && isAuthenticated` on
  `search.tsx:89-97` to match `ProductsList.tsx:99`. *Four small edits, no behavior change on the
  happy path.*
* **F-5 (A2).** Serialize `secureTokenStore` operations behind a single promise chain so `clear()`
  and `write()` cannot interleave. *`utils/secureTokenStore.ts`.*

### Phase 2 — only after §2 names the exception

* **If B1:** validate `buyer`/`seller`/`product` at the `setChatList` boundary
  (`chat-store.ts:313`) and in `_handleChatRoomCreated` (`:1046`), dropping malformed rows — fix it
  at the ingest point, not at the render site.
* **If C1:** replace `useBottomTabBarHeight()` with
  `useContext(BottomTabBarHeightContext) ?? 0` at `profile.tsx:45`, and narrow the store subscription
  at `:51` to selectors.
* **If the `user === null` window:** in `verifyOtp`, do not flip `isAuthenticated: true` until the
  user is resolved — move the `set()` at `:167` to after `fetchUser()`, or hold a
  `isAuthenticating` flag that the bootstraps and `AuthGuard` respect. **This is the structural fix**
  and the one most likely to close the whole §4B family at once. It is also the riskiest, which is
  why it must wait for proof.
* **If D1:** make `connect()`'s guard at `chat-store.ts:264` consult
  `signalRService.getConnectionState()` rather than store state.

---

## 10. Validation matrix

| ID | Scenario | Expected after fix | Verifies |
|---|---|---|---|
| T1 | Login → logout → login, all tabs visited first | No fallback; Chat tab populates | B1 |
| T2 | T1 with Chat tab open at logout | No fallback; SignalR reconnects in session 2 | B1, D1 |
| T3 | T1 on throttled 2G | No fallback; lands on Home with a populated profile | V5 window |
| T4 | Logout with airplane mode on, re-enable, login | No spurious "session expired" Alert; no fallback | A1, A3, E |
| T5 | Logout → force-kill → relaunch | Lands on `(auth)/welcome`; **no session restored** | A2 |
| T6 | Logout → login within 2 s | No fallback | A1, `sessionExpiredHandled` |
| T7 | Logout → wait 5 s → login | No re-entrant logout in telemetry | A1 `retryDelay` |
| T8 | Session 2: send + receive a chat message | Realtime delivery works | D1, D2 |
| T9 | Session 2: verify no session-1 data visible anywhere | Cache correctly partitioned | `queryClient.clear` |
| T10 | Force a deliberate render error in session 2 | **Exactly one** `REACT_RENDER_ERROR` row with `errorName` + `componentStack` | D-1, D-2, F-1 |
| T11 | Repeat T1 20× on iOS and 20× on Android | 0/20 both platforms | overall |
| T12 | `npx tsc --noEmit` | exit 0 | — |
| T13 | `npm run e2e` (`.maestro/flows`) | pass | regression |

**T10 is the gate for Phase 1.** If it fails, the diagnostics are still not trustworthy and no
conclusion drawn from them is either.

---

## 11. Risks

* **The app is live.** Phase 0 is additive logging plus one one-line interceptor guard; Phase 1 items
  are each independently revertable. Phase 2 is deferred behind proof for exactly this reason.
* **F-2 changes teardown semantics.** `cancelQueries` + `removeQueries` is not identical to `clear()`
  (mutation cache, `gcTime` behavior). Verify T9 — no session-1 data leaking into session 2 — before
  shipping. Data leakage across users on a shared device is a worse outcome than the crash.
* **The Phase 2 `verifyOtp` reordering is the highest-risk change in this document.** Delaying
  `isAuthenticated: true` until after `fetchUser()` means a user whose profile fetch fails on a flaky
  network cannot log in at all — trading a "sometimes" crash for a "sometimes cannot log in". It needs
  an explicit decision on the failure branch, not just a code move.
* **Diagnostics must be reverted.** D-4 (production console) and any verbose logging must come out
  before the next store build. D-1, D-2 and F-1 are worth keeping permanently.
* **Heisenbug risk.** Every candidate here is timing-dependent. Adding logging changes the timing and
  may suppress the repro. If the crash stops reproducing once diagnostics land, that is itself
  evidence for the race family (§4A) and against a deterministic null-deref — record it, do not
  dismiss it.
* **This audit found no reproduction.** Every §4 candidate is derived from code reading. Treat the
  ranking as a search order, not a conclusion.

---

## 12. Backend changes needed

**None to fix the crash.** Every mechanism identified is client-side.

Two backend items would materially help, neither blocking:

1. **Confirm `POST /telemetry/log` accepts unauthenticated requests.** If it currently 401s without a
   token, that is the direct cause of our missing crash reports (§1, A3) — the client fix F-1 handles
   the logout side-effect, but the report is still lost. It should accept anonymous logs.
2. **Confirm whether `POST /auth/verify-otp` returns a full user object in the response body.** If it
   does not, or returns one with `id: 0`, then `hasValidUserId` fails at `auth-store.ts:174` and every
   re-login goes through the `user === null` window in §3B. Making the endpoint reliably return the
   full user would close that window at the source, with no risky client reordering.

Worth checking while investigating (not a fix): whether any endpoint returns a 403 whose message
contains the phrase "deleted account" in an *object* sense (e.g. "cannot message a deleted account").
`utils/deletedAccount.ts:35`'s `/deleted account/i` pattern is not subject-anchored, unlike the other
three, so such a message would trigger `authAccountDeleted()` → logout + alert mid-session.

---

## 13. Phase 0 diagnostics — as implemented (2026-07-20)

**Status: shipped to the working tree. Phase 1 and Phase 2 are NOT implemented.**

Explicitly unchanged, as required: `verifyOtp` ordering, `queryClient.clear()` behaviour,
SecureStore sequencing, SignalR lifecycle, navigation, render guards, backend.

### 13.1 Files changed

| File | Change | Type |
|---|---|---|
| `utils/authPhase.ts` | **New.** `AuthPhase` marker + `setAuthPhase` / `getAuthPhase` | additive |
| `modules/Auth/auth-store.ts` | `logout()` and `verifyOtp()` bodies wrapped in `try { … } finally { setAuthPhase('idle') }` | additive |
| `components/providers/GlobalErrorBoundary.tsx` | `collectDiagnostics()` builds the PII-free bundle passed to `logger.fatal` | additive |
| `components/providers/AuthGuard.tsx` | mirrors the route into `logger.setScreen` | additive |
| `utils/logger.ts` | fatal dedupe folds in a stack hash; fatal mirrored to console in production | behavioural, scoped to `fatal` |
| `api/api.ts` | telemetry responses bail out before every session-mutating branch | behavioural, scoped to `telemetry/log` |

### 13.2 What a crash report now contains

`code: REACT_RENDER_ERROR`, `level: fatal`, plus:

| Field | Location in payload | Source |
|---|---|---|
| `errorName` | `extra.errorName` | `error.name` — the `TypeError` vs `Error` discriminator that R5 destroyed |
| `componentStack` | `extra.componentStack` | truncated to 2000 chars |
| `isAuthenticated` | `extra.isAuthenticated` | `useAuthStore.getState()` |
| `isHydrated` | `extra.isHydrated` | `useAuthStore.getState()` |
| `hasUser` | `extra.hasUser` | `!!state.user` — **boolean only** |
| `authPhase` | `extra.authPhase` | `idle` \| `logging-out` \| `logging-in` |
| **route** | **`screen` (top-level field, not `extra`)** | `segments.join('/')` via `logger.setScreen` |

**The route is the top-level `screen` field, not `extra.route`.** `MobileLogDto` already has a
dedicated `screen` column; duplicating it into `extra` would invite the two drifting apart. Note this
when verifying — the field is present, just not where you might grep first.

**Side effect worth knowing:** `logger.setScreen` existed (`utils/logger.ts:93`) but **was never
called anywhere in the app**, so `screen` has been `undefined` on *every* telemetry event ever sent,
not just crashes. Wiring it in `AuthGuard` fixes that globally.

**PII:** booleans, enums and route paths only. No token, refresh token, OTP, phone number, username,
user id, or user object. `hasUser` is a boolean precisely because the question that matters is
whether the app rendered with `isAuthenticated === true` while `user` was null (§3B) — a boolean
settles that without carrying identity off-device. Route params are excluded (`segments`, not
`pathname`), so `chat/[id]` never leaks a real chat id.

`collectDiagnostics` reads the store inside a `try/catch` that degrades to
`extra.authStateUnavailable = true`. It runs when the tree is already broken; it must never mask the
original error.

### 13.3 `authPhase` — read it correctly

`authPhase` marks only the window while `logout()` / `verifyOtp()` is **in flight**. Both clear to
`idle` in a `finally`.

**Consequence you must account for:** `verifyOtp` resolves *before* `auth.tsx:268` runs
`router.replace('/(tabs)/home')`. So a crash during the navigation into Home — the durable
`user === null` state from §3B, arguably the leading candidate — reports **`authPhase: 'idle'`**.

> **Do not read `authPhase: 'idle'` as "not a login problem."** The durable post-login state is
> identified by **`isAuthenticated: true` + `hasUser: false`**, which is the stronger signal.
> `authPhase` distinguishes §3A from §3B *during* the transition only.

Second limitation: `logout()` can be re-entered by the 401 interceptor (§4/A1). A nested call's
`finally` resets to `idle` while the outer call is still running, so a crash late in a re-entrant
logout may report `idle`. It never reports a *wrong* phase, only a missing one.

### 13.4 Fatal dedupe

`shouldDedupe` now folds a djb2 hash of the stack into the signature **for `fatal` only**:

```
fatal:  level|code|message|hash(stack)
other:  level|code|message          (unchanged)
```

Chosen over disabling dedupe entirely: distinct crash sites sharing a message (every
`Cannot read property 'id' of null`) no longer collapse, while an identical repeat — exactly what the
boundary's Retry produces, since §7 shows Retry cannot clear singleton state — still dedupes inside
the 30 s window. **One well-formed report per distinct crash site, and a Retry loop cannot flood the
backend.** This satisfies the "or dedupe must include stack hash" option.

### 13.5 Production console

`utils/logger.ts` mirrors to `console.error` when `__DEV__ || level === 'fatal'`. Scoped to `fatal`,
so `info`/`warn`/`error` stay dev-only and no routine log noise is added. **Temporary — revert before
the next store build** (§9/D-4).

### 13.6 Telemetry safety

`api/api.ts` returns `Promise.reject(error)` for any `telemetry/log` response **before** the
deleted-account 403 check and before the 401 block. Previously `_skipAuthRefresh: true` skipped only
the refresh and fell through to `else if (responseStatus === 401) authLogoutSessionExpired()`.

* Telemetry 401 → rejects, session untouched. `logger.send()` already swallows the rejection.
* Telemetry 403/5xx/network → also inert. A log POST must never mutate session state.
* **Every other URL is untouched** — 401 refresh, single-flight, retry, `authLogoutSessionExpired`,
  and deleted-account handling all behave exactly as before. This is the one Phase 0 change worth
  keeping permanently (it is F-1).

### 13.7 Validation status

| Check | Status |
|---|---|
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npx eslint` on all six changed files | **PASS** (exit 0) |
| No import cycle introduced | **VERIFIED** — `GlobalErrorBoundary` is imported only by `app/_layout.tsx`; `utils/authPhase.ts` is dependency-free |
| `npm run lint` | **DID NOT RUN** — fails in this environment with `'yarnpkg' is not recognized`, a local PATH issue unrelated to these changes. `npx eslint` was run directly instead. |
| Deliberate render-error test | **NOT RUN — no device or emulator available in this environment (`adb` not installed).** Must be run on-device per §13.8 before trusting any field data. |
| Telemetry 401 does not log the user out | **NOT RUN** — code path verified by reading; needs the on-device check in §13.8. |
| Ordinary authenticated 401 unchanged | **NOT RUN** — the guard is scoped by URL and the branch below is untouched; needs the on-device check in §13.8. |

**Three of the four runtime validations are unexecuted.** The reasoning above is code-reading only.
Run §13.8 before drawing any conclusion from field telemetry.

### 13.8 Reproduction instructions

**Build:** `npm run build:android:preview` (APP_ENV=staging) or a local `npm run android` dev build.
A physical device is required for the push-token paths in §3A.

#### T-A — Deliberate render-error test (gates everything else)

The error must throw during **render** — a throw inside an `onPress` handler is not caught by a React
error boundary. Add a temporary state-flag trigger to a screen reachable while logged in, e.g.
`app/(tabs)/profile.tsx`:

```tsx
// TEMPORARY — remove after validation
const [boom, setBoom] = useState(false)
if (boom) throw new TypeError('DIAG_TEST_CRASH')
// ...and somewhere in the returned JSX:
<Text onPress={() => setBoom(true)}>diag</Text>
```

1. Log in, go to Profile, tap `diag`.
2. Confirm the fallback appears.
3. **Device log** (`npx react-native log-android` / `adb logcat -s ReactNativeJS` / Console.app):
   expect one `[FATAL] REACT_RENDER_ERROR DIAG_TEST_CRASH` line **in a production/staging build**.
4. **Backend:** query `telemetry/log` for `code = 'REACT_RENDER_ERROR'`. Expect **exactly one** row
   with `screen = 'tabs/profile'`, and `extra` containing `errorName: 'TypeError'`,
   `componentStack`, `authPhase: 'idle'`, `isAuthenticated: true`, `isHydrated: true`,
   `hasUser: true`.
5. Tap **Retry** three times. Expect **no additional rows** (identical stack, deduped) — confirming
   both that dedupe still protects the backend and, per §7, that Retry does not recover.
6. **Remove the trigger.**

**If step 4 returns zero rows, stop.** The reporting path is still broken and no field data can be
trusted. Check §12 item 1 first: whether `POST /telemetry/log` accepts unauthenticated requests.

#### T-B — Telemetry 401 must not log the user out

1. Log in and reach Home.
2. Force telemetry to 401: server-side, make `POST /telemetry/log` return 401 unconditionally; or
   locally, point `ENDPOINT.LOG.LOG` at a path that 401s.
3. Trigger any logged event (T-A's crash, or any screen that emits a warn).
4. **Expect:** user stays logged in. No "session expired" Alert. No redirect to `(auth)/welcome`.
   Before this change, this reliably logged the user out.

#### T-C — Ordinary authenticated 401 must be unchanged

1. Log in.
2. Invalidate the session server-side (revoke both access and refresh token).
3. Pull-to-refresh Home or open Chat.
4. **Expect unchanged behaviour:** one refresh attempt, then `authLogoutSessionExpired()` → redirect
   to `(auth)/welcome` → "session expired" Alert on the next `app/index` mount.
   **Regression check:** if the user is *not* logged out here, the §13.6 guard is over-broad.

#### T-D — Capture the real crash

Run §8's full matrix on the instrumented build. **V4 (throttled 2G during the OTP step) and V6
(force-kill between logout and login) remain the two highest-value runs.**

For every occurrence record: `errorName`, `screen`, `authPhase`, `isAuthenticated`, `hasUser`, and
the top 5 frames of `componentStack`.

**Decision table once a report lands:**

| Report shape | Points to |
|---|---|
| `errorName: 'Error'` + `useBottomTabBarHeight` in stack | §4/C1 |
| `errorName: 'TypeError'` + `isAuthenticated: true` + `hasUser: false` | §4/B family — the §3B window |
| `errorName: 'TypeError'` + `screen: 'tabs/chat'` | §4/B1 `transformChatItem` |
| `authPhase: 'logging-out'` | §3A window — §4/A races |
| `screen: 'search'` | §4/B2 |

Then, and only then, implement the matching Phase 2 fix from §9.

> **Outcome:** the captured report matched **none** of the rows above — `errorName: 'Error'` with
> `AuthGuard` at the top of the component stack. See §14.

---

## 14. PROVEN ROOT CAUSE — navigate-before-mount in `AuthGuard` (fixed)

### 14.1 The exception

```
Error: Attempted to navigate before mounting the Root Layout component.
Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.
```

```
AuthGuard
RootLayout
expo-router / React Navigation
```

Note `errorName: 'Error'`, **not** `TypeError`. That single field — added in §13 precisely because the
logger had never transmitted it (R5) — is what ruled out the entire §4/B null-dereference family in
one step.

### 14.2 Why it happens, and why only on the *second* login

`AuthGuard` is a sibling rendered **before** `<Stack>` in `app/_layout.tsx`:

```tsx
<AuthGuard />          {/* ← effects fire first */}
<ChatBootstrap />
<NotificationBootstrap />
<VersionCheckBootstrap />
<Stack …>              {/* ← navigator registers here */}
```

React fires effects in tree order, so `AuthGuard`'s effect runs **before** `<Stack>` has attached its
navigator to the root navigation container. Any `router.replace()` in that gap throws.

The timing is what made this look like a re-login bug:

* **Cold launch —** `isHydrated` is `false` on the first pass, so the effect hit
  `if (!isHydrated) return` and did nothing. By the time keychain hydration resolved (an async
  `SecureStore` read), the navigator was long since mounted. **The bug was masked by hydration
  latency.**
* **Logout → login again —** the store is **already hydrated**. Any remount of `AuthGuard` runs the
  redirect on its very first effect, with `isHydrated === true` and `isAuthenticated === false`,
  before the navigator exists. → throw → `GlobalErrorBoundary`.

This also explains the sticky fallback: per §7, `Retry` remounts the subtree but cannot clear the
singleton auth store, so `AuthGuard` remounts into the same already-hydrated state and re-throws
immediately.

**Both platforms are affected equally** — this is React effect ordering, not a native timing
difference. The §6 prediction that iOS would reproduce more often was wrong, and for the right
reason: it assumed a keychain-latency race, and the real cause has no keychain dependency at all.

### 14.3 Audit answers (pre-edit checks)

| # | Question | Answer |
|---|---|---|
| 1 | Where does `AuthGuard` call `router.replace`? | `components/providers/AuthGuard.tsx`, single call site, inside the auth effect |
| 2 | Does it run before `<Slot>`/`<Stack>` mounts? | **Yes** — sibling ordered before `<Stack>`; effects fire in tree order |
| 3 | Is `useRootNavigationState()` available? | **Yes** — exported by `expo-router@~6.0.22`; returns `{ key, index, routeNames, routes, … }` |
| 4 | Does `RootLayout` always render a navigator on first render? | **Yes** — no conditional returns |
| 5 | Does any provider block `<Stack>` on first render? | **No** — `ThemeProvider` and `NetworkProvider` both render `{children}` unconditionally; `SafeAreaProvider` has `initialMetrics` |
| 6 | Can multiple components navigate at once? | **Yes** — `AuthGuard` (`replace`), `app/index.tsx` (`<Redirect>`), `profile.tsx` logout (`replace`), `auth.tsx` login (`replace`). All targets agree, so the duplication is idempotent; only `AuthGuard` ran pre-mount |

Because of #4 and #5, **`RootLayout` did not need restructuring.** The navigator was always mounted
on the first render — the defect was purely that `AuthGuard`'s effect ran ahead of it.

### 14.4 The fix

One file: `components/providers/AuthGuard.tsx`.

```ts
const rootNavigationState = useRootNavigationState()
const isNavigatorReady = !!rootNavigationState?.key
```

Readiness condition: **`!!useRootNavigationState()?.key`**. The hook returns `undefined` until the
root navigator is registered; `key` is populated only once it is attached to the container. (Its
TypeScript signature declares `key` as always present, hence the optional chain — the type is
optimistic about a value that really is undefined on the first renders.)

The effect now gates in order: **navigator ready → hydrated → not already authenticated/in-auth-group
→ not a duplicate of the redirect already issued from this route.**

Duplicate suppression uses `redirectedFromRef`, keyed on the **route path** rather than a boolean
latch. A boolean would stay set if the user reached some *other* unauthenticated route, and the guard
would then decline to redirect — silently weakening auth protection (rule 8). Keying on the route
re-arms the guard on every route change.

### 14.5 Redirect behaviour, before vs after

| Scenario | Before | After |
|---|---|---|
| Cold launch, unauthenticated | `replace('/(auth)/welcome')` after hydration | **unchanged** |
| Cold launch, authenticated | no-op; `app/index.tsx` redirects to `(tabs)/home` | **unchanged** |
| Logout from any screen | `replace('/(auth)/welcome')` | **unchanged** |
| Session-expired / deleted-account logout | `replace('/(auth)/welcome')` | **unchanged** |
| Login again | no-op (authenticated); `auth.tsx` navigates to `(tabs)/home` | **unchanged** |
| **Redirect needed before navigator mounted** | **throws → error boundary** | **deferred until `key` exists, then redirects normally** |
| Effect re-runs on same route with redirect pending | second `replace()` | suppressed |

Auth protection is unchanged in every reachable state: the guard still redirects any hydrated,
unauthenticated user who is outside `(auth)`. It only ever *defers*, never *skips*.

### 14.6 Explicitly not changed

`app/_layout.tsx` (unmodified), `verifyOtp` / auth-store ordering, token persistence,
`queryClient.clear()`, SignalR lifecycle, `GlobalErrorBoundary`, routes, backend, login API.
Phase 0 diagnostics (§13) retained in full — `authPhase`, `hasUser`, and the `screen` route field are
untouched and still correct; `logger.setScreen` still fires from the same component.

Phase 1 and Phase 2 from §9 remain **unimplemented**.

### 14.7 Validation

| Check | Status |
|---|---|
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npx eslint components/providers/AuthGuard.tsx` | **PASS** (exit 0, no findings) |
| Cold launch → login → logout → login again, ×5 | **NOT RUN — no device or emulator in this environment (`adb` not installed)** |
| No "Attempted to navigate before mounting" in logs | **NOT RUN** |
| Logout from home / chat / session-expired / deleted-account | **NOT RUN** |
| Slow keychain / slow network during login | **NOT RUN** |
| `GlobalErrorBoundary` no longer triggers | **NOT RUN** |
| First login still works | **NOT RUN** |
| Deep links do not regress | **NOT RUN** |

**Every runtime check is unexecuted.** Static analysis is strong here — the readiness gate is the
documented Expo Router pattern and the failing call site is unambiguous — but *"the crash no longer
reproduces"* is an empirical claim and has not been made. Run §13.8's build plus the matrix above
before closing this out.

**Deep links deserve an explicit check.** A cold-start deep link into an authenticated route while
unauthenticated now defers the redirect by a frame or two instead of throwing. Expected behaviour is
identical (land on `welcome`), but it is the one path where the added deferral is observable.

### 14.8 Remaining risks

* **Runtime unverified** (§14.7). Highest-priority follow-up.
* **The §4 backlog is still open.** Every candidate there is a genuine defect that survived this fix
  — in particular **A3** (telemetry 401 → logout, mitigated in §13.6 but the underlying pattern of
  ungated 401s remains), **A2** (SecureStore `clear`/`write` race, which can resurrect a refresh
  token after logout), **B2** (`search.tsx:103` missing optional chain, ungated query), and **D1**
  (orphan SignalR connect leaving chat silently dead for the whole second session). None of these
  crashes the app; all can produce wrong behaviour.
* **The `isAuthenticated: true` + `user: null` window (§3B) still exists.** It no longer crashes, but
  a re-login whose `fetchUser()` fails on a flaky network still lands on Home with a null user.
* **Duplicate `replace()` across components is not deduped.** `profile.tsx` and `AuthGuard` both
  redirect to `welcome` on logout. Idempotent and pre-existing; left alone to keep this slice
  focused.
* **Phase 0 diagnostics are still installed**, including the production `console.error` for fatals
  (§13.5). Revert that before the next store build. Keep the telemetry guard (§13.6).
