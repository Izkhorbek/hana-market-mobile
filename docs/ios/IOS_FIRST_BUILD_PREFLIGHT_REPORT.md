# iOS First-Build Gate — Preflight Report

**Date:** 2026-07-11
**Verdict: 🔴 BLOCKED ON MANUAL SETUP** — the build was **not** started.
**HEAD:** `02ddb8bf36655f07907efe4cc5747df57875db76` (`02ddb8b` — *feat(app): increase maximum radius limit from 20 to 40 km*)
**Bundle ID:** `com.hanamarket.app` · **EAS project:** `38e5dbb1-914a-4ef8-9d98-b00d65b4f84f` · **Expo SDK:** 54

Two independent gate conditions failed: the app icon is not App-Store-compliant, and the EAS production environment cannot be verified (EAS CLI not installed/authenticated). Per the gate rules, no build command was run and no credentials were touched.

---

## 1. Verified HEAD & working-tree state

```
HEAD  02ddb8bf36655f07907efe4cc5747df57875db76
Staged (git diff --cached):  <none>
```
Working tree — modified (unstaged):
| File | Owner | In scope? |
|---|---|---|
| `app.config.ts` | this iOS task | ✅ iOS-only edits |
| `app.json` | user (`supportsTablet:false`) | ✅ iOS field only |
| `eas.json` | this iOS task (+ user Android submit edit) | ✅ my change = iOS submit only |
| `plugins/with-network-security.js` | this iOS task | ✅ iOS-only edits |
| `api/api.ts` | **user — unrelated** | ⛔ not touched |
| `app/(settings)/favorites.tsx` | **user — unrelated** | ⛔ not touched |
| `types/index.ts` | **user — unrelated** | ⛔ not touched |
| `docs/ios/` (untracked) | this iOS task | ✅ reports only |

No commit was created. No files were staged.

## 2. Preflight commands & results

| Command | Result |
|---|---|
| `git rev-parse HEAD` | `02ddb8b…db76` |
| `git status --short` | 6 modified + `docs/ios/` untracked (see §1) |
| `git diff --cached` | empty (nothing staged) |
| `git diff --check` | clean (no whitespace errors) |
| `node --check plugins/with-network-security.js` | ✅ syntax OK |
| `eas.json` JSON parse | ✅ valid |
| `npx expo config --type public` | ✅ resolves (see §4) |
| `APP_ENV=production EAS_BUILD_PLATFORM=ios npx expo config --type introspect` | ✅ resolves; ATS strict; 0 `NSPinnedDomains`; Maps key present (see §4) |
| `npx expo install --check` | ⚠️ version drift (out of scope — not changed) |
| `npx expo-doctor` | ⚠️ 2 checks fail (lock file + version drift) — unchanged, out of scope |
| `npx eas whoami` | ❌ EAS CLI not resolvable (`could not determine executable`) |
| `eas` on PATH | ❌ not installed |
| `eas env:list --environment production` | ❌ **could not run — CLI not authenticated** |

Secret/config **values** were never printed — only presence, length, type, exit codes, and structure.

## 3. Icon metadata (gate check)

```
assets/images/icon.png  →  width 1027  height 1027  hasAlpha true  channels 4 (RGBA)
```
**FAIL.** Required: exactly **1024×1024**, **`hasAlpha=false`** (24-bit opaque RGB, sRGB, square, no rounded corners). App Store Connect rejects icons that are the wrong size or contain an alpha channel.

## 4. Resolved iOS configuration (verified)

`--type public`:
```
ios: {
  supportsTablet: false,                       ✅
  bundleIdentifier: 'com.hanamarket.app',      ✅
  infoPlist: {
    NSLocationWhenInUseUsageDescription: '…',   ✅ (used)
    NSPhotoLibraryUsageDescription: '…',        ✅ (used)
    ITSAppUsesNonExemptEncryption: false        ✅
    // camera / photo-add strings correctly absent ✅
  }
}
```
`--type introspect` (APP_ENV=production, iOS):
```
NSAppTransportSecurity.NSAllowsArbitraryLoads: false      ✅ strict ATS
NSPinnedDomains count: 0                                  ✅ no root-level key; pinning inactive (invalid .env pins ignored)
ios.config.googleMapsApiKey: '<redacted>'                ✅ present when key set
```

- **No root-level `NSPinnedDomains`.** ✅
- **No pinning config emitted** because the local pins are invalid placeholders and the plugin now requires **two** valid 44-char base64 pins. ✅ (This is the desired release-1 state: pinning disabled.)

## 5. EAS production environment — presence matrix (UNVERIFIED)

EAS CLI is not installed/authenticated, so the EAS-hosted production environment could **not** be inspected. Status below is what the gate requires; **you must confirm each with `eas env:list --environment production` after authenticating.** Local `.env` is shown for reference **only — do not copy `.env` values into EAS.**

| Variable | Required for iOS prod | EAS production status | Local `.env` (reference only) |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` (HTTPS) | ✅ required | ❓ UNVERIFIED | present, HTTPS ✔ |
| `GOOGLE_MAPS_API_KEY_IOS` | ✅ required | ❓ UNVERIFIED | present (len 39) |
| `EXPO_PUBLIC_SENTRY_DSN` | optional | ❓ UNVERIFIED | present |
| `EXPO_PUBLIC_SENTRY_ORG` / `_PROJECT` | optional | ❓ UNVERIFIED | present |
| `SENTRY_AUTH_TOKEN` (secret) | optional | ❓ UNVERIFIED | present |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` / `TERMS_URL` / `SUPPORT_EMAIL` | optional (code defaults exist) | ❓ UNVERIFIED | present |
| `API_PIN_SHA256` | **must be ABSENT (release 1)** | ❓ UNVERIFIED | invalid placeholder (ignored by plugin) |
| `API_BACKUP_PIN_SHA256` | **must be ABSENT (release 1)** | ❓ UNVERIFIED | invalid placeholder (ignored by plugin) |

> The guard (`app.config.ts`) will hard-fail the iOS production build if `EXPO_PUBLIC_API_URL` or `GOOGLE_MAPS_API_KEY_IOS` are missing/non-HTTPS in the build environment — so a missing var cannot silently ship, but it **will** stop the build.

## 6. Proof Android output is unchanged

Resolved `android` block (`expo config --type public`) — **byte-identical** to the pre-task baseline:
```
android: {
  edgeToEdgeEnabled: true,
  predictiveBackGestureEnabled: false,
  package: 'com.hanamarket.app',
  versionCode: 1,
  permissions: [ 'ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION', 'CAMERA', 'READ_MEDIA_IMAGES', 'INTERNET' ],
  adaptiveIcon: { foregroundImage: './assets/images/android-icon-foreground.png', backgroundColor: '#FFFFFF' }
}
```
- iOS-production guard is gated on `EAS_BUILD_PLATFORM==='ios'` → never runs for Android.
- Plugin changes confined to `isValidSpkiPin` + `withNetworkSecurityIos`; Android functions byte-identical to HEAD.
- `eas.json`: only `submit.production.ios` changed by this task.
- (Note: the unrelated user edits to `api/api.ts` / `favorites.tsx` / `types/index.ts` are shared/JS-runtime code, not Android build config; not part of this task.)

## 7. Apple credential choices

**None made.** No Distribution Certificate, Provisioning Profile, or APNs key was created, selected, rotated, or revoked — the build was not started. On the eventual build, accept **EAS-managed** Distribution Certificate + Provisioning Profile, and the **EAS-managed APNs key** if offered.

## 8. Build result

**No build started.** No build URL / build ID (gate blocked).

---

## 9. Exact remaining manual steps (unblock, then re-run this preflight)

1. **Fix the icon (BLOCKER).** Replace `assets/images/icon.png` with a **1024×1024, opaque, no-alpha** PNG (same artwork, same path). To flatten an existing square source onto white and resize:
   ```bash
   node -e "require('sharp')('assets/images/icon.source.png').resize(1024,1024).flatten({background:'#FFFFFF'}).removeAlpha().png().toFile('assets/images/icon.png')"
   # verify:
   node -e "require('sharp')('assets/images/icon.png').metadata().then(m=>console.log(m.width,m.height,m.hasAlpha))"   # expect: 1024 1024 false
   ```
   *(Adjust the background if the logo isn't white-safe; do not redesign the artwork.)*

2. **Install & authenticate EAS CLI.**
   ```bash
   npm i -g eas-cli
   eas login
   eas whoami
   ```

3. **Verify / set the EAS production environment** (do not paste `.env` values blindly; use verified production values):
   ```bash
   eas env:list --environment production
   # must contain EXPO_PUBLIC_API_URL (HTTPS) and GOOGLE_MAPS_API_KEY_IOS
   # must NOT contain API_PIN_SHA256 / API_BACKUP_PIN_SHA256  (release 1)
   ```
   If either required var is missing, create it (see readiness report §9), then re-verify.

4. **Re-run this preflight**, then run the build (below).

## 10. Exact build command (run only after §9 is green)

```bash
# Uses the dedicated production-ios profile (extends production; selects the EAS
# production environment in-profile — no --environment CLI flag needed).
eas build --platform ios --profile production-ios
# Accept EAS-managed Distribution Certificate + Provisioning Profile prompts.
# Accept the EAS-managed APNs key if offered.
```

## 11. Exact TestFlight submit command — DO NOT run in this task

```bash
eas submit --platform ios --profile production
# Interactive auth (Apple ID or ASC API key); pick the com.hanamarket.app app.
```
`ITSAppUsesNonExemptEncryption:false` means no "Missing Compliance" prompt in TestFlight.
