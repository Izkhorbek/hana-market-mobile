# ARCHITECTURE.md

Hana Market (Nebor) — mobile app architecture & clean-code rules.

> **Purpose.** This is the team contract. Every new feature (Xizmat, Gaz, Mahalla, …)
> is built to follow these rules. When in doubt, this document wins over habit.
>
> **Guiding principle.** We already have a clean, layered architecture. We do **not**
> rewrite it — we **formalize, extend, and enforce** it. We deliberately avoid
> textbook "Clean Architecture" (UseCase/Entity/DI-container classes): it fights
> React Query and adds boilerplate with no payoff in a React Native app.

---

## 1. Layers & the Dependency Rule

```
┌──────────────────────────────────────────────────────────────┐
│ PRESENTATION   app/ (Expo Router screens), components/         │  UI only
│      │  calls hooks only — never services directly             │
│      ▼                                                          │
│ APPLICATION    api/hooks/, hooks/, modules/<Feature>/*-store   │  orchestration, state
│      │                                                          │
│      ▼                                                          │
│ DOMAIN         types/, mappers/                                 │  DTOs, models, validation
│      ▲                                                          │
│ DATA           api/services/, api/services/signalr.service,    │  axios, SignalR, keychain
│                utils/secureTokenStore, storage                 │
└──────────────────────────────────────────────────────────────┘
```

**The Dependency Rule (the single most important rule):**

1. Dependencies point **downward only**. Never upward.
2. **Presentation → Application → Data.** A screen/component MUST NOT import from
   `api/services/*`. It talks to the data layer only through a hook.
3. The **Data layer** (`api/services/*`) MUST NOT import UI, stores, or hooks.
4. `types/` and `mappers/` are the shared **Domain** — any layer may import them;
   they import nothing upward.

If you feel the urge to break this rule, the design is wrong — fix the design.

---

## 2. Where does a feature live? `modules/` vs global

Our own code already encodes this: Auth/Chat live in `modules/` (they hold live
client state), Product lives in the global layer (stateless CRUD). Make it a rule:

| Feature kind | Home | Examples |
|---|---|---|
| **Stateless CRUD** (server cache is enough) | Global: `api/services/*.service.ts` + `api/hooks/use*.ts` | Product, **Xizmat** |
| **Live / client state** (Zustand + realtime) | `modules/<Feature>/` + a store | Chat, **Gaz** (live session) |

Consequences for the current roadmap:
- **Xizmat = global layer.** No new module. `service.service.ts` + `useService.ts` + types.
- **Gaz = `modules/Gas/`.** Live distribution session state + SignalR, plus a
  global `gas.service.ts` for the REST parts.

---

## 3. State ownership — one source of truth

Two state systems coexist; never mix their responsibilities.

- **React Query** (`api/queryClient.ts`, `api/hooks/*`) = **server cache.**
  Anything the server owns: products, services, profile, chat history. Defaults:
  `retry: 0`, `staleTime: 5m`, no refetch-on-focus/reconnect.
- **Zustand** (`modules/*/*-store.ts`) = **client / realtime state.**
  Live messages, unread counts, typing, presence, live gas session position.

Rule: if the server is the authority, it goes in React Query. If it's live/ephemeral
client state pushed over SignalR or set locally, it goes in Zustand. Do not cache
server lists in Zustand, and do not put transient UI toggles in React Query.

---

## 4. Standard feature skeleton

Every new feature uses the **same file set**, so the codebase stays predictable.

```
Xizmat (global, stateless):            Gaz (module, live state):
  types/service.ts        (DTOs)         modules/Gas/gas.types.ts      (DTOs)
  api/services/                          modules/Gas/gas-store.ts      (Zustand)
    service.service.ts    (data)         api/services/gas.service.ts   (REST)
  api/hooks/useService.ts (app)          api/hooks/useGas.ts           (app)
  mappers/serviceMapper.ts (domain)      modules/Gas/gas.mappers.ts    (domain)
  components/service/     (UI)           components/gas/               (UI)
  app/... screens                        app/... screens
```

**Type files.** `types/index.ts` is already ~940 lines — too large. New features get
their own `types/<feature>.ts`, re-exported from `types/index.ts`. Low risk, scales.

---

## 5. Design patterns in use (and the one to add)

| Pattern | Where | Purpose |
|---|---|---|
| **Repository / Service** | `api/services/*` | Data-access abstraction over axios/SignalR |
| **Facade / Bridge** | `api/auth-bridge.ts` | Break the axios ↔ auth-store circular dep |
| **Singleton** | `signalRService` | One `HubConnection` for the whole session |
| **Observer / PubSub** | SignalR listener registry, Zustand subscriptions | Realtime fan-out |
| **Provider / Bootstrap** | `ChatBootstrap`, `NotificationBootstrap`, theme provider | Session-scoped lifecycle |
| **Custom Hook** | `api/hooks/*` | Encapsulate data + orchestration |
| **Strategy** | `CreateThingForm` / `CreateCarForm` / `CreateWorksForm` | Per-type create form |
| **Optimistic UI** | chat send (negative id + `localId` + `isPending`) | Instant feedback, server echo reconciles |
| **⭐ Mapper / Adapter** | **add this** — currently ad-hoc in components | DTO (`snake_case`) ↔ UI model |

**Mapper is the one real gap.** DTO→UI mapping is scattered inside components today.
For new features, put it in `mappers/` (or `modules/<Feature>/*.mappers.ts`). Keep
components dumb.

---

## 6. Clean-code rules (enforced)

1. **Dependency Rule** — no upward imports (§1). To be enforced by ESLint import
   boundaries (see §9).
2. **Single source of truth** — React Query = server, Zustand = client (§3).
3. **Centralized error handling** — 401 is handled once in the axios response
   interceptor with single-flight refresh (`runSingleFlightRefresh`); forms use
   `parseApiError`. Never add a second refresh/logout path.
4. **No raw `console`** — always `utils/logger.ts` (dedupes, truncates, posts to
   `/telemetry/log`, drops Sentry breadcrumbs).
5. **DTOs are `snake_case` at the boundary.** Map to `camelCase` domain models via a
   mapper only when it improves the UI layer. Be consistent within a feature.
6. **Dumb components.** Logic lives in hooks/stores; components render.
7. **Barrel exports.** Expose hooks via `api/hooks/index.ts`.
8. **Path alias `@/`** for all internal imports (never deep relative `../../../`).
9. **i18n.** User-facing strings go through `t()` / `useTranslations()` — no hardcoded
   copy. Add keys to `locales/{uz,ru,en}.json`.

---

## 7. Add-a-new-feature checklist

Use this for Xizmat, Gaz, Mahalla, and everything after.

1. [ ] `types/<feature>.ts` — DTOs + request/response types; re-export from `types/index.ts`.
2. [ ] Enums (if any) in `constants/enums.ts` (numeric, matching backend).
3. [ ] `api/endpoints.ts` — add the endpoint block (prefix-less; `baseURL` has `/api`).
4. [ ] `api/services/<feature>.service.ts` — axios calls returning `ApiResponse<T>`.
5. [ ] `api/hooks/use<Feature>.ts` — React Query hooks; export via `api/hooks/index.ts`.
6. [ ] (Live state only) `modules/<Feature>/<feature>-store.ts` + SignalR wiring.
7. [ ] `mappers/` — DTO ↔ UI mapping if non-trivial.
8. [ ] UI: reuse `components/FormElements/*` (FormInput, FormSelect, RadioButtonGroup,
       ImageUploader) and existing list/card patterns.
9. [ ] i18n keys in all three locales.
10. [ ] `npx tsc --noEmit` → 0 errors. `npm run lint` → clean.
11. [ ] Verify the Dependency Rule wasn't broken.

---

## 8. Anti-patterns — do NOT do these

- **Importing `auth-store` from `api/api.ts` or `api/auth-bridge.ts`.** Reintroduces
  the circular dependency the bridge exists to break.
- **A second auth-failure path.** 401 refresh/logout is centralized in the interceptor.
  Do not add another (the store's legacy `fetchUser` double-handling is the cautionary tale).
- **Re-subscribing to SignalR events inside a screen.** The socket is global
  (`ChatBootstrap`); screens only join/leave rooms. Re-subscribing creates duplicate listeners.
- **Calling `api/services/*` from a component.** Always go through a hook.
- **Caching server lists in Zustand** or putting transient UI state in React Query.
- **Raw `console.*`**, hardcoded user-facing strings, deep relative imports.

---

## 9. Enforcement

Rules that aren't enforced rot. Two gates:

1. **Type gate** — `npx tsc --noEmit` must be 0 (this is our main fast feedback loop;
   there is no unit-test runner).
2. **Boundary gate** — ESLint import-boundary rules (`eslint-plugin-import`
   `no-restricted-paths`, or `eslint-plugin-boundaries`) mechanically forbid:
   - `app/**` and `components/**` importing `api/services/**`
   - `api/services/**` importing `app/**`, `components/**`, `modules/**`, or `api/hooks/**`
   This turns the Dependency Rule from a document into a build error.

---

## 10. Relationship to other docs

- **CLAUDE.md** — subsystem deep-dives (auth, chat, SignalR, notifications). Authoritative
  for *how the existing subsystems work*.
- **docs/GAZ_NAVBATI_BACKEND_SPEC.md** — the Gaz data model & API contract.
- **skills/*.md** — per-subsystem design notes.
- This file — the *rules new code follows*. Update it when a rule changes.
