# iOS EAS Config Parse Fix — `Unexpected token '{'`

**Date:** 2026-07-14
**Verdict: 🟢 READY TO REBUILD** (config parses on a plain-JS Node runtime; all iOS release checks pass).
**HEAD:** `02ddb8bf36655f07907efe4cc5747df57875db76` (`02ddb8b` — *feat(app): increase maximum radius limit from 20 to 40 km*)
**Bundle ID:** `com.hanamarket.app` · **EAS project:** `38e5dbb1-914a-4ef8-9d98-b00d65b4f84f` · **Expo SDK:** 54 · **Node local:** v22.13.0 · **npm:** 10.9.2

Scope: iOS production/TestFlight config only. **No Android config, permissions, package, versionCode, build, submit, or dependency behavior was changed.** No secrets committed. No build/prebuild/submit was run.

---

## 1. Root cause (exact file, line, construct)

**File:** `app.config.ts` — **line 17:**

```ts
import type { ConfigContext, ExpoConfig } from 'expo/config'
```

`app.config.ts` was a **TypeScript** file containing TypeScript-only syntax. EAS Build reads the Expo config on the build server (`/Users/expo/workingdir/build/app.config.ts`) through a Node path that evaluated the file **as plain JavaScript, without TypeScript transpilation**. The first TypeScript-only construct in the file is the type-only import on line 17. Parsed as a plain ES module, `import type { … }` is read as a default import of a binding literally named `type`, after which the parser expects `,` or `from` but hits `{` → **`SyntaxError: Unexpected token '{'`**, with the caret under the `{`.

### Byte-exact reproduction

```
$ printf "import type { A, B } from 'x'\nexport default 1\n" > t.mjs && node --check t.mjs
t.mjs:1
import type { A, B } from 'x'
            ^
SyntaxError: Unexpected token '{'
```

This matches the EAS failure message and caret position exactly. Other TS-only constructs in the same file (`const missing: string[]`, `const sentryPlugin: any[]`, `const android: ExpoConfig['android']`, `const ios: ExpoConfig['ios']`, `(baseConfig as { expo: ExpoConfig })`, `({ config }: ConfigContext): ExpoConfig`) would each also throw once reached — line 17 simply fails first.

## 2. Why local checks previously missed it

`npx expo config` and `npx expo-doctor` run locally load `app.config.ts` through the project's installed `@expo/config`, which **bundles a TypeScript transpiler (sucrase)**. That transpiler silently strips `import type` and every annotation before evaluation, so the file loaded fine and exited `0`. The prior preflight reports (`IOS_FIRST_BUILD_PREFLIGHT_REPORT.md`, `IOS_PRODUCTION_READINESS_REPORT.md`) ran exactly those commands and saw success — they could not surface a failure that only occurs on a runtime that does **not** transpile TypeScript. EAS's config read used such a runtime, so the TS-only syntax was fatal there and invisible locally.

**Net:** the failure is environmental (transpile vs. no-transpile), not a broken value. Any check that runs through Expo's transpiling loader cannot catch it. The reliable guard is to remove the dependency on transpilation altogether.

## 3. The fix (minimal, safe, definitive)

Convert the dynamic config from TypeScript to **plain CommonJS JavaScript**, so it is parseable by *any* Node runtime (builder or local) with **no transpile step**:

- **Deleted** `app.config.ts`.
- **Added** `app.config.js` — identical logic and identical resolved output; only TypeScript-only syntax removed:
  - `import type { ConfigContext, ExpoConfig } from 'expo/config'` → **removed** (types are compile-time only; unused at runtime).
  - `import baseConfig from './app.json'` → `const baseConfig = require('./app.json')`.
  - `export default ({ config }: ConfigContext): ExpoConfig => {` → `module.exports = ({ config }) => {`.
  - `(baseConfig as { expo: ExpoConfig }).expo` → `baseConfig.expo`.
  - `const missing: string[] = []` → `const missing = []`.
  - `const sentryPlugin: any[] = []` → `const sentryPlugin = []`.
  - `const android: ExpoConfig['android'] = {` → `const android = {`.
  - `const ios: ExpoConfig['ios'] = {` → `const ios = {`.
  - A header comment documents *why* the file must stay plain JS (do not reintroduce TS syntax).

No env-driven value, key, merge, guard, plugin argument, or ordering was changed. `package.json` has no `"type": "module"`, so CommonJS (`require`/`module.exports`) is the correct, universally-parseable form. Expo prefers `app.config.js` over `app.json` exactly as it did `app.config.ts`, and no code imports the config module (only doc comments in `constants/featureFlags.ts`, `constants/support.ts`, `plugins/with-network-security.js` mention it by name).

## 4. Files changed

| File | Change | Owner/Scope |
|---|---|---|
| `app.config.ts` | **Deleted** | this iOS task |
| `app.config.js` | **Added** (CJS port of the same config) | this iOS task |

(Unchanged by *this* fix but part of the in-flight iOS working tree from prior steps: `app.json` iOS fields, `eas.json` iOS submit + `production-ios` profile, `plugins/with-network-security.js` iOS pinning. Unrelated user edits `api/api.ts`, `app/(settings)/favorites.tsx`, `types/index.ts`, `scripts/generate-app-icons.js` were **not touched**.)

## 5. Commands & results

| # | Command | Result |
|---|---|---|
| 1 | `node --version` / `npm --version` | v22.13.0 / 10.9.2 |
| 2 | `node --check app.config.js` (plain-JS parse = the EAS condition) | ✅ exit 0 — **the failing parse now passes** |
| 3 | reproduce `import type {` as ESM (`node --check t.mjs`) | ✅ `SyntaxError: Unexpected token '{'` (root cause confirmed) |
| 4 | `npx expo config --type public` | ✅ exit 0 |
| 5 | `APP_ENV=production EAS_BUILD_PLATFORM=ios npx expo config --type introspect` | ✅ exit 0 with required env present |
| 6 | Android block `diff` (before vs after) | ✅ **byte-identical** |
| 7 | iOS block `diff` (before vs after, prod introspect) | ✅ **byte-identical** |
| 8 | Guard: missing `GOOGLE_MAPS_API_KEY_IOS` (iOS prod) | ✅ throws, names `GOOGLE_MAPS_API_KEY_IOS` |
| 9 | Guard: missing `EXPO_PUBLIC_API_URL` (iOS prod) | ✅ throws, names `EXPO_PUBLIC_API_URL` |
| 10 | Guard: non-HTTPS `EXPO_PUBLIC_API_URL` (iOS prod) | ✅ throws "must use HTTPS" |
| 11 | Android prod with missing iOS Maps key | ✅ exit 0 (guard is iOS-only; Android-safe) |
| 12 | `eas.json` JSON parse / `"//"` key scan | ✅ valid; **no `//` pseudo-comments** |
| 13 | `node --check plugins/with-network-security.js` | ✅ syntax OK |
| 14 | `git diff --check` | ✅ clean |
| 15 | `npx expo install --check` | ⚠️ patch-version drift (pre-existing, **out of scope**, unchanged) |
| 16 | `npx expo-doctor` | ⚠️ 16/18 pass; the 2 failures are **lock file** + **SDK patch drift** (pre-existing, out of scope). No Expo-config-read error. |

## 6. Resolved iOS config summary (secrets redacted)

`--type public` / `--type introspect` (APP_ENV=production, EAS_BUILD_PLATFORM=ios):

```
ios.supportsTablet                                    : false                 ✅ (checklist 5)
ios.bundleIdentifier                                  : com.hanamarket.app    ✅ (checklist 4)
ios.config.googleMapsApiKey                           : <redacted, present>   ✅ (checklist 10)
infoPlist.ITSAppUsesNonExemptEncryption               : false                 ✅ (checklist 6)
infoPlist.NSAppTransportSecurity.NSAllowsArbitraryLoads: false                ✅ (checklist 7)
infoPlist.NSPinnedDomains (root level)                : ABSENT                ✅ (checklist 8)
infoPlist.NSAppTransportSecurity.NSPinnedDomains      : absent → pinning OFF  ✅ (checklist 9 — needs 2 valid SPKI pins to activate)
infoPlist.NSLocationWhenInUseUsageDescription         : present (used)        ✅
infoPlist.NSPhotoLibraryUsageDescription              : present (used)        ✅
```

Certificate pinning stays disabled: the plugin requires two valid 44-char base64 SPKI pins and the environment supplies none (or invalid placeholders). HTTPS + strict ATS still apply.

## 7. Android unchanged — proof

Resolved `android` block is **byte-for-byte identical** before and after the fix (`diff` of the JSON-serialized block → no output). Baseline:

```json
{"adaptiveIcon":{"foregroundImage":"./assets/images/android-icon-foreground.png","backgroundColor":"#FFFFFF"},"edgeToEdgeEnabled":true,"predictiveBackGestureEnabled":false,"package":"com.hanamarket.app","versionCode":1,"permissions":["ACCESS_COARSE_LOCATION","ACCESS_FINE_LOCATION","CAMERA","READ_MEDIA_IMAGES","INTERNET"]}
```

- The `.ts → .js` port removed only type annotations; every value/merge is unchanged.
- The iOS production guard is gated on `EAS_BUILD_PLATFORM === 'ios'`, so it never runs for Android (proven: Android prod with empty iOS vars exits 0).
- `eas.json`, `app.json` Android fields, and the plugin's Android functions were not touched by this fix.

## 8. Remaining blockers (unchanged from prior preflight — not caused by this fix)

1. **App icon** — must be exactly **1024×1024, opaque (no alpha)** for App Store Connect. (Working tree adds `icon-iphone.png`; verify its metadata before submit.)
2. **EAS production environment** — confirm `EXPO_PUBLIC_API_URL` (HTTPS) and `GOOGLE_MAPS_API_KEY_IOS` exist in the EAS `production` environment, and that `API_PIN_SHA256` / `API_BACKUP_PIN_SHA256` are **absent** (release 1). Requires `eas-cli` login (`eas env:list --environment production`).
3. Patch-version drift (expo-doctor / install --check) — cosmetic, out of scope for this task.

None of these are config-parse issues; the parse failure is resolved.

## 9. Exact next build command

```bash
eas build --platform ios --profile production-ios
```

`production-ios` extends `production`, sets `environment: production`, and `ios.simulator: false` → a non-simulator App Store build. Do **not** start a paid build until blockers §8.1–§8.2 are green. Do not run `eas submit` in this task.
