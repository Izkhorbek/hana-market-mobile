# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Hana Market (a.k.a. Nebor) — a location-based marketplace mobile app (Carrot/Karrot-style) built with Expo + React Native, talking to a .NET 8 backend over REST + SignalR. Three languages (uz/ru/en). The npm package name is `hana-market`; the display/store name is "Nebor".

## Commands

```bash
npm start                      # expo start (dev server)
npm run android                # expo run:android (native dev build)
npm run ios                    # expo run:ios
npm run web                    # expo start --web
npm run lint                   # expo lint (ESLint, flat config in eslint.config.js)
npx tsc --noEmit               # typecheck — no npm script for it; this is the main fast feedback loop
                               # since there's no unit-test runner. (tsconfig is emit-only, but --noEmit
                               # overrides cleanly and exits 0 on success.)

# E2E (Maestro — the ONLY test layer; there is no unit test runner)
npm run e2e                    # maestro test .maestro/flows
npm run e2e:auth               # single flow: maestro test .maestro/flows/01-auth.yaml
npm run e2e:record             # JUnit report to .maestro/report.xml

# EAS builds (profiles defined in eas.json: development | preview | production)
npm run build:android:preview      # internal APK, APP_ENV=staging
npm run build:android:production   # AAB, APP_ENV=production
npm run build:ios:production
```

Run a single E2E flow by pointing `maestro test` at a specific `.maestro/flows/*.yaml` file.

## Configuration & Environment

- **`app.config.ts` is the source of truth for build config**, not `app.json`. It imports `app.json` as a base, then injects env-driven values (Sentry DSN, Google Maps keys, cert-pinning hashes, legal URLs) and computes platform blocks. Edit static fields (icons, splash) in `app.json`; edit anything env-dependent or permission-related in `app.config.ts`.
- Env vars live in `.env` (see `.env.example`). `EXPO_PUBLIC_*` vars are bundled into the app; non-prefixed ones (e.g. `SENTRY_AUTH_TOKEN`, `API_PIN_SHA256`) are build/CI only.
- `EXPO_PUBLIC_API_URL` **must be HTTPS in production** — `api/api.ts` throws at startup otherwise, and cleartext is blocked at the platform level (`plugins/with-network-security.js` writes the Android network-security-config + iOS ATS, with optional SPKI cert pinning).
- `APP_ENV` (`development|staging|production`) is read via `Constants.expoConfig.extra.appEnv` and drives prod-only guards.
- **Path alias:** `@/*` maps to the repo root (`tsconfig.json` + `babel.config.js` module-resolver). Always import via `@/...`.

## Architecture

### Layering
`UI (app/, components/) → hooks (api/hooks/, hooks/) → services (api/services/) → axios/SignalR`. Screens never call services directly except through hooks. Two state systems coexist:
- **Zustand** = client/realtime state (`modules/Auth/auth-store.ts`, `modules/Chat/chat-store.ts`).
- **React Query** = server cache (`api/queryClient.ts`, `api/hooks/*`). Global defaults: `retry: 0`, `staleTime: 5m`, no refetch-on-focus/reconnect.

Routing is file-based via **Expo Router** (`app/`). Route groups: `(auth)`, `(tabs)`, `(post)`, `(settings)`, plus dynamic `chat/[id]`, `product/[id]`. `app/index.tsx` is the gate: it waits for `isHydrated`, then redirects to `/(tabs)/home` or `/(auth)/welcome`.

### Auth & Token system (read these together)
`api/auth-bridge.ts`, `api/api.ts`, `modules/Auth/auth-store.ts`, `utils/secureTokenStore.ts`.

- **Bridge pattern breaks a circular dependency:** `api/api.ts` (axios) must call into the auth store, but the store imports the axios services. So `auth-bridge.ts` holds setter-injected function refs (`getAuthToken`, `refreshAuthToken`, `authLogoutSessionExpired`). The store registers them at the bottom of `auth-store.ts`. **Never import `auth-store` from `api/api.ts` or `auth-bridge.ts`** — it reintroduces the cycle.
- **Auth is OTP-based** (request-otp → verify-otp). Tokens arrive in `X-Access-Token` / `X-Refresh-Token` / `X-Expires-At` / `X-Refresh-Token-Expires-At` response headers, extracted by `extractAuthTokens`. (On web these need CORS `Access-Control-Expose-Headers`.)
- **Token persistence is split:** the 4 tokens live in the OS keychain via `secureTokenStore` (one atomic JSON blob, `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`); everything else (user, flags) is in AsyncStorage via zustand `persist`. `partialize` deliberately excludes tokens so they never sit in plaintext. On rehydrate, `hydrateTokensFromVault` loads tokens from the keychain *before* marking `isHydrated`, handles the legacy AsyncStorage→keychain migration, and validates/refreshes on startup.
- **401 handling is centralized in the axios response interceptor** with a single-flight refresh (`runSingleFlightRefresh`): concurrent 401s share one refresh call. The `/auth/refresh` and `/auth/logout` calls set `_skipAuthRefresh` to avoid recursion. When adding auth-failure handling elsewhere, rely on the interceptor — do not add a second refresh/logout path (the store's `fetchUser` currently double-handles this).

### Chat & SignalR system
`api/services/signalr.service.ts`, `modules/Chat/chat-store.ts`, `api/hooks/useSignalR.ts`, `api/hooks/useChat.ts`, `app/chat/[id].tsx`, `components/providers/ChatBootstrap.tsx`.

- **Hybrid model:** REST (`api/hooks/useChat.ts`) loads history/pagination; SignalR delivers realtime. The Zustand `chat-store` is the live source of truth for messages, chat list, unread counts, typing, and presence.
- **`signalRService` is a singleton** wrapping a single `HubConnection`, with `accessTokenFactory` re-reading the token each (re)connect so rotation is honored, custom reconnect backoff, and a manual listener registry (`on*` methods return unsubscribers). The store wires its handlers via `_setupEventListeners`.
- **Connection lifecycle is global, not per-screen:** `ChatBootstrap` (mounted once in `app/_layout.tsx`) keeps the socket open for the whole authenticated session, prefetches the chat list, and mirrors the REST unread count into the store. The chat room screen must NOT re-subscribe to SignalR events (it would create duplicate listeners) — it only joins/leaves rooms via `useChatRoom`.
- **Optimistic send:** outgoing messages get a negative `id` + `localId` and `isPending`; the server echo (`ReceiveMessage`) replaces the matching temp message. `ensureJoined`/connect/join use single-flight promise maps so concurrent callers share one negotiation.
- **`app/chat/[id].tsx` merges two message sources** (React Query `apiMessages` + store `storeMessages`) into `mergedMessages`, de-duped by key and re-sorted. This is the main source of complexity in the chat layer.

### Notifications
`components/providers/NotificationBootstrap.tsx`, `api/services/notification.service.ts`. Native FCM (Android) / APNS (iOS) device tokens via `expo-notifications` — registered with the backend on login, deactivated on logout. Tap handling (`navigateFromNotification`) routes by `type` + `related_id` to chat/product screens, including cold-start (`getLastNotificationResponseAsync`).

### Cross-cutting
- **Logging/telemetry:** always go through `utils/logger.ts` (not raw `console`). It dedupes, truncates per backend limits, posts to `/telemetry/log`, and drops Sentry breadcrumbs. `logger.error` accepts both `('CODE', err, opts)` and `(err, { code })` shapes.
- **Error reporting:** Sentry is initialized first in `app/_layout.tsx` (`utils/sentry.ts`); the root is wrapped with `sentryWrap` and `GlobalErrorBoundary`. No-op when no DSN.
- **Theming:** `theme/theme-provider.tsx` + `hooks/use-theme-colors.ts` / `useColor`. Pull colors from the theme; avoid hardcoded hex except one-off accents.
- **i18n:** `react-i18next`, locales in `locales/{uz,ru,en}.json`, accessed via `useTranslations()` → `t()`. Bootstrapped by importing `@/constants/localization`. Note: several chat strings are still hardcoded English and should use `t()`.

## Deep-dive docs

`skills/*.md` contain detailed design notes per subsystem (`auth-system`, `chat-system`, `notification-realtime`, `location-map-system`, `safe-area-handling`, `hana-market-core`). `api/*.md` document the backend contract (REST + SignalR sequences). Read the relevant one before non-trivial work in that area.

**On-demand only (do NOT auto-load):** `docs/ANALYSIS.md` is a point-in-time technical-debt/bug audit. It is a stale-prone snapshot, not a live spec — open it only when explicitly working on the refactoring/cleanup it describes, and re-verify any claim against the current code first. Don't read it at the start of unrelated tasks. `docs/FIX-PROGRESS.md` is its live companion tracker (written in Uzbek): bug IDs map 1:1 to ANALYSIS.md, ordered P0→P1→P2. Keep it updated after each fix when doing that cleanup work.
