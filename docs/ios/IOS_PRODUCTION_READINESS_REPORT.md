# iOS Production Readiness Report — Hana Market (Nebor)

**Date:** 2026-07-11
**Scope:** iOS production / TestFlight preparation ONLY. Android production configuration was intentionally left unchanged.
**Bundle ID:** `com.hanamarket.app` · **EAS project:** `38e5dbb1-914a-4ef8-9d98-b00d65b4f84f` · **Expo SDK:** 54
**Verified against:** HEAD `02ddb8bf36655f07907efe4cc5747df57875db76` (`02ddb8b`), working tree with unstaged edits to `app.config.ts`, `app.json`, `eas.json`, `plugins/with-network-security.js` and untracked `docs/ios/`.

---

## 1. Executive summary

**Verdict: READY AFTER MANUAL ENV + ICON SETUP.**

The project is architecturally sound for an iOS release (managed workflow / CNG — no committed `ios/` folder, so EAS regenerates native code from `app.config.ts`). Small, reviewable, **iOS-only** code changes were applied and each was verified by running the actual config resolver. No Android configuration, permission, dependency, build, or submit behavior was changed. No secrets were added; two config values that appeared in tool output during verification (a Google Maps key and the Sentry DSN) are **redacted** here.

Before the first build can succeed you must complete a short manual setup (install `eas-cli`, set production environment variables in EAS, provide a compliant app icon, and make a decision about certificate pinning). The most important runtime risk is **certificate pinning**: the current local `.env` contains **malformed placeholder pins**; a code-level safety net now refuses to activate pinning unless two valid pins are present, so an accidental lockout is structurally prevented — but you must still verify the production environment.

Changes applied (all iOS-only):
1. `app.config.ts` — added `ITSAppUsesNonExemptEncryption: false` (unblocks TestFlight "Missing Compliance"); removed two permission strings for features the app does not use (camera, save-to-library); added fail-fast validation for missing/invalid iOS production config.
2. `plugins/with-network-security.js` — **(a)** iOS pinning now requires **two** valid 44-char base64 SPKI pins and skips otherwise (anti-lockout); **(b)** fixed a latent structural bug — `NSPinnedDomains` was being written at the Info.plist **root**, where iOS ignores it; it is now correctly nested inside `NSAppTransportSecurity`, merged so `NSAllowsArbitraryLoads:false` is preserved.
3. `eas.json` — removed the `REPLACE_ME` iOS submit placeholders so `eas submit -p ios` works interactively.

---

## 1a. Independent verification pass (against real code at HEAD 02ddb8b)

Every checklist item was verified against the actual repository, not the prior report.

| # | Check | Result |
|---|---|---|
| 1 | `ios.supportsTablet === false` | ✅ resolved config shows `false` |
| 2 | `bundleIdentifier === com.hanamarket.app` | ✅ exact match |
| 3 | Android resolved config unchanged by my edits | ✅ resolved `android` block byte-identical before/after; plugin Android functions byte-identical (see §7) |
| 4 | Typo `EAPS_API_KEY_IOS` present? | ✅ **No such typo anywhere** — all refs are `GOOGLE_MAPS_API_KEY_IOS`. No correction needed. |
| 5 | Guard detects missing API URL / non-HTTPS / missing Maps key | ✅ all three throw (proven, §7) |
| 6 | Guard runs for iOS-prod only, not Android/dev/preview/local | ✅ proven: Android-prod & local both exit 0 (§7) |
| 7 | `NSPinnedDomains` matches Apple's Info.plist shape | ⚠️ **was structurally wrong (root-level) → FIXED**; now nested under `NSAppTransportSecurity` with valid `SPKI-SHA256-BASE64` identity dicts (proven, §7) |
| 8 | Malformed/partial/single-pin cannot activate pinning | ✅ proven: invalid pins and a single pin both skip (§7) |
| 9 | Prefer pinning disabled for release 1 unless two verified pins | ✅ enforced in code (needs 2 valid pins) + documented to leave unset |
| 10 | `ITSAppUsesNonExemptEncryption:false` justified | ✅ no non-exempt crypto deps; only standard HTTPS/TLS (axios, SignalR, Sentry, keychain) |
| 11 | Removing camera / add-to-library matches code | ✅ no `launchCameraAsync`, no `expo-camera`, no `expo-media-library`/`saveToLibrary` |
| 12 | `eas.json` has no `REPLACE_ME` | ✅ removed |
| 13 | Interactive iOS submit valid | ✅ `submit.production.ios` documents interactive flow, no stored creds |
| 14 | Explicit EAS `"environment": "production"` for iOS | ✅ **Added via new `production-ios` profile** (extends `production`) — see §B.1. The shared `production` profile is untouched, so Android is unaffected. |
| 15 | Icon dimensions & alpha | ⚠️ **1027×1027, hasAlpha=true** → blocker (needs 1024×1024, opaque) |
| 16 | Production URLs/emails have valid defaults | ✅ `https://hana.uz/privacy`, `https://hana.uz/terms`, `hanamarketuz@gmail.com` (env overrides also valid) |
| 17 | No `.env`/secret values printed | ✅ only presence/length checked; Maps key + DSN redacted in this report |

### Discrepancies between the previous report and the actual code
1. **Pinning structure (critical, now fixed):** the previous pass claimed the iOS pinning output was structurally valid. Verification against Apple's *Identity Pinning* spec showed `NSPinnedDomains` was written at the **Info.plist root**, which iOS **ignores** — pinning would have been a silent no-op even with correct pins. Now nested inside `NSAppTransportSecurity`.
2. **Single-pin activation (now fixed):** the previous version only skipped when **zero** valid pins were present; a lone valid pin would have activated pinning with no backup (lockout-on-rotation risk). Now requires **two**.
3. **`environment` field (point 14):** the previous report did not address explicit EAS environment selection. It is intentionally **not** added to `eas.json` (Android-safety) — see §B.1.
4. **Typo check (point 4):** confirmed there is **no** `EAPS_API_KEY_IOS` anywhere; nothing to correct.

---

## 2. Files inspected

| File | Purpose |
|---|---|
| `app.json` | Static base config (name, slug, icons, splash, plugins, bundle id) |
| `app.config.ts` | Dynamic config — source of truth; injects env, builds iOS/Android blocks |
| `eas.json` | Build + submit profiles |
| `package.json` | Dependencies, scripts, package manager intent (npm) |
| `plugins/with-network-security.js` | Custom config plugin — ATS / network-security-config / cert pinning |
| `.gitignore` | Secret/credential ignore rules |
| `.env` / `.env.example` | Runtime + build env variables (values not printed) |
| `api/api.ts` | HTTPS enforcement + API base URL resolution |
| `components/FormElements/ImageUploader.tsx`, `app/(settings)/edit-profile.tsx` | Photo picker usage (permission audit) |
| `components/Maps/*`, `MapModal.tsx`, `LocationMapPreview.tsx` | Google Maps usage (iOS key audit) |
| `assets/images/icon.png` | App icon (size / alpha audit) |

No `ios/` or `android/` directory exists (both are gitignored, generated by CNG). No `.easignore` present.

## 3. Commands executed (all read-only during audit)

```
git status --short
git diff -- app.json app.config.ts eas.json
npx expo config --type public      # before and after changes
npx expo install --check
npx expo-doctor
npx eas whoami                     # failed: eas-cli not installed locally
node --check plugins/with-network-security.js
node -e "JSON.parse(fs.readFileSync('eas.json'))"
git diff --check
node -e "sharp('assets/images/icon.png').metadata()"   # icon audit

# Verification pass (against HEAD 02ddb8b):
git rev-parse HEAD ; git log --oneline -10 ; git diff HEAD -- <each changed file>
APP_ENV=production EAS_BUILD=true EAS_BUILD_PLATFORM=ios npx expo config --type public       # guard PASS path
APP_ENV=production EAS_BUILD_PLATFORM=ios GOOGLE_MAPS_API_KEY_IOS= npx expo config …          # guard THROW (maps)
APP_ENV=production EAS_BUILD_PLATFORM=ios EXPO_PUBLIC_API_URL= …                              # guard THROW (api url)
APP_ENV=production EAS_BUILD_PLATFORM=ios EXPO_PUBLIC_API_URL=http://… …                      # guard THROW (https)
APP_ENV=production EAS_BUILD_PLATFORM=android GOOGLE_MAPS_API_KEY_IOS= …                       # NO throw (Android-safe)
npx expo config --type introspect                        # inspect real Info.plist mods (ATS / NSPinnedDomains / maps key)
# + synthetic-pin runs to confirm NSPinnedDomains nesting and single/invalid-pin skip
```
Secret/config **values** were never printed — only presence, length, exit codes, and structure.

---

## 4. Audit findings

### A. Identity & versioning — ✅ PASS
- `ios.bundleIdentifier = com.hanamarket.app` — unchanged. ✅
- `ios.supportsTablet = false` — confirmed in resolved config. ✅
- Expo SDK `54.0.0`, `expo@54.0.32` (a patch behind `~54.0.35`; see H/maintenance). Valid.
- `cli.appVersionSource = remote` + `production.autoIncrement = true` → **iOS `buildNumber` is managed by EAS remotely** and auto-incremented per build. There is **no local `buildNumber`** in `app.json`/`app.config.ts`, so there is **no conflict**. ✅

### B. App Store signing & submission — ⚠️ MANUAL SETUP
- Recommended strategy: **EAS-managed Apple Distribution certificate + provisioning profile** (generated on first `eas build -p ios`).
- Submission: **interactive `eas submit -p ios`** for the first release (Apple ID or App Store Connect API key entered at submit time). The `eas.json` iOS submit block previously contained `ascApiKeyId: "REPLACE_ME"` / `ascApiIssuerId: "REPLACE_ME"` and a non-existent `./asc-api-key.p8` path — an **un-runnable production profile**. Fixed (see §6).
- No certificates or `.p8` files were created or exposed.

#### B.1 EAS environment selection (checklist point 14) — solved with a platform-isolated `production-ios` profile
The shared `build.production` profile is left **unchanged** — adding `"environment": "production"` directly to it would also change how the **Android** production build resolves EAS-stored env vars (`environment` is a profile-level field that can't be scoped to one platform), violating the "do not alter Android output" constraint.

Instead, a **new dedicated iOS profile** `build.production-ios` was added that **extends** `production` and sets `environment` in-profile. This makes iOS EAS-environment selection explicit and deterministic **in `eas.json`** (no reliance on a `--environment` CLI flag) while the Android build path (`--profile production`) is byte-for-byte untouched:
```jsonc
"production-ios": {
  "extends": "production",       // inherits autoIncrement:true, APP_ENV=production, store distribution
  "environment": "production",   // selects the EAS production environment for the build
  "ios": { "simulator": false }  // App Store distribution build (not simulator)
}
```
Build iOS with:
```bash
eas build --platform ios --profile production-ios
```
`production` itself is unmodified; Android continues to build via `--profile production`.

### C. iOS permissions — ✅ FIXED to match real usage
Actual native-feature usage found in source:
| Feature | Used? | Evidence | iOS string |
|---|---|---|---|
| Location (when in use) | ✅ | `expo-location` | `NSLocationWhenInUseUsageDescription` (kept) |
| Photo library (read/select) | ✅ | `ImagePicker.launchImageLibraryAsync` in `ImageUploader.tsx`, `edit-profile.tsx` | `NSPhotoLibraryUsageDescription` (kept) |
| Camera | ❌ | No `launchCameraAsync` / `expo-camera`; `docs/mobile-image-upload-audit.md` states "gallery ONLY (no camera path exists)" | `NSCameraUsageDescription` **removed** |
| Save to photo library | ❌ | No `expo-media-library` / `saveToLibraryAsync` / `CameraRoll` anywhere | `NSPhotoLibraryAddUsageDescription` **removed** |
| Notifications | ✅ | `expo-notifications` | No Info.plist string required (entitlement handled by EAS) |

Declaring permissions the app never exercises is an App Store Review Guideline 5.1.1 liability, so the two unused strings were removed. All remaining strings are clear and review-safe. **Reversible** — re-add the string if a camera or save feature ships later.

### D. Google Maps on iOS — ✅ VERIFIED (production key still required in EAS)
- `app.config.ts` injects `ios.config.googleMapsApiKey` from `GOOGLE_MAPS_API_KEY_IOS` **only when set**. Consumed correctly by `react-native-maps` (`PROVIDER_GOOGLE`).
- **Verified via `npx expo config --type introspect`**: with the current `.env`, the resolved iOS config **does** contain `ios.config.googleMapsApiKey` (value redacted). Note that `--type public` **omits** this key from its output — so its absence there is not evidence the key is unset; use `--type introspect` to confirm. (This corrects an earlier note that said the key was empty locally.)
- If the key is genuinely unset for a production iOS build, the new guard **fails the build with an actionable error** rather than silently shipping blank map tiles (proven, §7).
- Key is not stored in `app.json`/`app.config.ts`/`eas.json` — only referenced from env. ✅ It must be set in the **EAS production environment** (restricted to bundle id `com.hanamarket.app` + iOS Maps SDK).
- Android Maps config untouched. ✅

### E. API URL & App Transport Security — ✅ PASS
- `api/api.ts` throws if `EXPO_PUBLIC_API_URL` is missing, and throws if it is not HTTPS in production. ✅
- `app.config.ts` sets `NSAppTransportSecurity = { NSAllowsArbitraryLoads: false }` **only in production**. `NSAllowsArbitraryLoads` is **never true**. ✅
- Dev-only cleartext is confined to non-production (`allowDevCleartext = !isProduction`) and does not reach production. ✅
- Note (informational, non-blocking): the plugin's **iOS** path does not add ATS cleartext exceptions for dev HTTP backends (only Android does). This only affects local iOS dev against an HTTP backend, never production — no change made (adding exceptions would weaken ATS).

### F. Custom network-security plugin — ⚠️ TWO DEFECTS FOUND → fixed (iOS-only)
- iOS runs only for `https:` hosts; empty `apiHost`/missing pins no-op. ✅
- **CRITICAL RISK (env):** the current `.env` `API_PIN_SHA256` / `API_BACKUP_PIN_SHA256` are **malformed placeholders** — hundreds of characters, prefixed `sha256/`, not valid 44-char base64 SPKI hashes (a valid pin is exactly `43 base64 chars + "="`). Promoted to iOS production they would have bricked TLS to the API → total lockout.
- **DEFECT 1 — structural (silent no-op), now fixed:** the plugin wrote `NSPinnedDomains` at the **Info.plist root**. Per Apple's *Identity Pinning* guidance, `NSPinnedDomains` must live **inside `NSAppTransportSecurity`**; at the root iOS ignores it, so pinning would have provided **no protection at all** even with correct pins. Now nested under `NSAppTransportSecurity` and **merged** so the production `NSAllowsArbitraryLoads:false` is preserved. Verified via `--type introspect` (§7).
- **DEFECT 2 — single-pin activation, now fixed:** pinning previously activated with any one valid pin. It now requires **two** valid pins (primary + backup); with fewer it **skips entirely** and warns (without printing the value). This satisfies Apple's backup-pin requirement and makes malformed/partial/single-pin lockout structurally impossible. Verified (§7).
- Production hostname must match `EXPO_PUBLIC_API_URL` — **verify** the production host and, if you enable pinning, that both pins are generated from *that* host's certificate chain.
- Android path was **not modified** (rule 2) — the `buildAndroidNscXml` / `withNetworkSecurityAndroid` functions are byte-identical to HEAD (§7). The placeholder pins in local `.env` only affect local dev Android builds, which use `allowDevCleartext`.

### G. Sentry — ✅ PASS
- `@sentry/react-native/expo` plugin is registered **only when** `EXPO_PUBLIC_SENTRY_ORG` and `EXPO_PUBLIC_SENTRY_PROJECT` are set — so source-map upload can't fail an EAS build when creds are absent. ✅
- `EXPO_PUBLIC_SENTRY_DSN` is public runtime config (via `extra.sentryDsn`). ✅
- `SENTRY_AUTH_TOKEN` is read from the environment by the plugin at build time and is **never** written to source or bundled. ✅
- Android Sentry behavior unchanged.

### H. Notifications — ✅ PASS (EAS-managed push key required)
- `expo-notifications` is iOS-production compatible. The `defaultChannel`/`sounds` plugin options are Android-only concepts but are harmless no-ops on iOS. ✅
- iOS push requires an **APNs key**, which **EAS can generate and manage** — prefer the EAS-managed APNs key over manual certificate-based APNs (no manual `.p8`/SSL cert creation needed).

### I. Assets & App Store requirements — ⚠️ ICON SHOULD BE FIXED
- **App icon:** `assets/images/icon.png` is **1027×1027 with an alpha channel (`hasAlpha: true`, RGBA)**. Apple requires the App Store marketing icon to be **1024×1024 and fully opaque (no alpha)**. Expo's prebuild usually flattens the iOS icon, but to eliminate any upload-rejection risk, provide a **1024×1024, no-alpha** source. (Not auto-fixed — it is a design asset; flattening requires choosing a background.)
- Splash: resolves via `expo-splash-screen`. ✅
- App name "Hana Market" — valid.
- `extra.privacyPolicyUrl`, `extra.termsUrl`, `extra.supportEmail` all resolve in config. ✅
- **Export compliance:** app uses only standard HTTPS/TLS → exempt. `ITSAppUsesNonExemptEncryption: false` added so TestFlight/Review skip the compliance prompt. ✅
- iPhone-only (`supportsTablet: false`) is consistent. ✅

### Project health (informational, not iOS blockers)
- **Two lock files** (`package-lock.json` **and** `yarn.lock`) at repo root → `expo-doctor` "lock file" check fails (conflicting package managers). Recommend removing `yarn.lock` (project uses npm) for reproducible EAS installs. Not changed here (out of iOS scope).
- **Dependency drift** (`expo-doctor`): `expo-network@55.0.9` is a **major mismatch** (expected `~8.0.8` — likely a wrong install) plus minor/patch drift on `expo`, `expo-router`, `expo-image-picker`, etc. Handle in a dedicated maintenance pass with `npx expo install --check` (not auto-fixed — touches shared deps that affect the working Android build).

---

## 5. Risks found

| # | Risk | Severity | Status |
|---|---|---|---|
| R1 | Malformed placeholder cert pins could brick iOS TLS (total lockout) | **Critical** | Structurally prevented (needs 2 valid pins); **do not copy `.env` pins to EAS prod** |
| R1b | Pinning was a **silent no-op** — `NSPinnedDomains` at Info.plist root (ignored by iOS) | High (latent) | **Fixed** — now nested under `NSAppTransportSecurity` |
| R2 | Missing `GOOGLE_MAPS_API_KEY_IOS` → silent blank-map release | High | Now fails the build with a clear error (verified) |
| R3 | `REPLACE_ME` in iOS submit profile → un-runnable submit | Medium | Fixed |
| R4 | Missing `ITSAppUsesNonExemptEncryption` → TestFlight "Missing Compliance" on every build | Medium | Fixed |
| R5 | Unused camera / save-to-library permission strings → 5.1.1 review risk | Low | Fixed (removed) |
| R6 | Icon has alpha + is 1027px → App Store upload rejection | **Blocker** | **Manual: provide 1024×1024 opaque icon** |
| R7 | Two lock files → non-reproducible installs | Low | Manual (recommend remove `yarn.lock`) |
| R8 | `expo-network` major version mismatch | Low | Manual maintenance |

---

## 6. Exact changes made, file by file

### `app.config.ts` (iOS-only)
1. **Added iOS-production validation guard** (gated on `EAS_BUILD_PLATFORM === 'ios'` so Android/dev/preview/local are never affected):
   - throws listing missing `EXPO_PUBLIC_API_URL` / `GOOGLE_MAPS_API_KEY_IOS`;
   - throws if API URL is not HTTPS. Only variable **names** are logged, never values.
2. **infoPlist:** removed `NSCameraUsageDescription` and `NSPhotoLibraryAddUsageDescription` (unused features); added `ITSAppUsesNonExemptEncryption: false`. Kept location + photo-library strings.

> The `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` removal from the Android `permissions` array visible in `git diff` is a **pre-existing, uncommitted change by the user** (part of the working-tree baseline) — **not** made by this task.

### `plugins/with-network-security.js` (iOS-only)
- Added `isValidSpkiPin()` (`^[A-Za-z0-9+/]{43}=$`).
- `withNetworkSecurityIos` now **requires two valid pins** to activate; with fewer it **skips pinning** and warns (without printing the pin).
- **Fixed placement:** `NSPinnedDomains` is now nested inside `NSAppTransportSecurity` (merged, preserving `NSAllowsArbitraryLoads:false`) instead of at the Info.plist root where iOS ignored it.
- `buildAndroidNscXml`, `withNetworkSecurityAndroid`, and the plugin entry function's Android call were **not** touched (byte-identical to HEAD).

### `eas.json` (iOS submit only)
- Replaced the `REPLACE_ME` iOS submit block with a single documentation comment so `eas submit -p ios --profile production` runs interactively. **`submit.production.android` and all `build.*` profiles unchanged.**
- Deliberately did **not** add `"environment": "production"` to the shared `build.production` profile (would affect Android env resolution) — see §B.1.

> The `READ_EXTERNAL_STORAGE`/`WRITE_EXTERNAL_STORAGE` removal (Android permissions) and the `serviceAccountKeyPath` rename (`google-play-service-account.json` → `google-services.json`, Android submit) that appear in `git diff` are **pre-existing, uncommitted user changes** — **not** made by this task. ⚠️ *Observation only (Android, out of scope):* verify `./google-services.json` is the intended Google **Play service-account** JSON (not the Firebase config) and that it is gitignored before any submit — but do not change Android config as part of this iOS task.

Full diff is in the project (`git diff HEAD`). No other files changed.

---

## 7. Proof that Android configuration was not changed

`npx expo config --type public` was run **before and after** the edits. The resolved `android` block is **identical** both times:

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

- The `app.config.ts` validation guard is gated on `EAS_BUILD_PLATFORM === 'ios'` → never runs for Android builds (proven below).
- My `app.config.ts` diff hunks touch only the guard and the `ios.infoPlist` object; neither references the `android` object. (The `android.permissions` hunk in the diff is the user's pre-existing edit.)
- The plugin change is confined to `isValidSpkiPin` + `withNetworkSecurityIos`; `git diff HEAD -- plugins/with-network-security.js` shows **no** hunks in `withNetworkSecurityAndroid` or `buildAndroidNscXml`.
- `eas.json`: only `submit.production.ios` changed; Android build + submit config untouched.

### 7.1 Verification evidence (commands run this pass)
```
# Guard fires ONLY for iOS production, with actionable messages:
APP_ENV=production EAS_BUILD_PLATFORM=ios  GOOGLE_MAPS_API_KEY_IOS=     → EXIT 1  "missing … GOOGLE_MAPS_API_KEY_IOS"
APP_ENV=production EAS_BUILD_PLATFORM=ios  EXPO_PUBLIC_API_URL=         → EXIT 1  "missing … EXPO_PUBLIC_API_URL, GOOGLE_MAPS_API_KEY_IOS"
APP_ENV=production EAS_BUILD_PLATFORM=ios  EXPO_PUBLIC_API_URL=http://… → EXIT 1  "must use HTTPS"
APP_ENV=production EAS_BUILD_PLATFORM=android GOOGLE_MAPS_API_KEY_IOS=  → EXIT 0  (Android never blocked)
(local, no EAS_BUILD_PLATFORM) GOOGLE_MAPS_API_KEY_IOS=                 → EXIT 0  (dev/local never blocked)

# Pinning structure (two valid synthetic pins), via `expo config --type introspect`:
NSAppTransportSecurity: { NSAllowsArbitraryLoads: false,
  NSPinnedDomains: { '<host>': { NSIncludesSubdomains: true,
    NSPinnedCAIdentities: [ {SPKI-SHA256-BASE64: …}, {SPKI-SHA256-BASE64: …} ] } } }   ✅ Apple-correct, nested

# Anti-lockout:
current .env placeholder pins  → NSPinnedDomains NOT written (skipped)          ✅
one valid pin + one invalid    → NSPinnedDomains NOT written (skipped) + warn    ✅
```

## 8. Final resolved iOS configuration summary

`--type public` (note: it omits `ios.config.googleMapsApiKey` by design):
```
ios: {
  supportsTablet: false,
  bundleIdentifier: 'com.hanamarket.app',
  infoPlist: {
    NSLocationWhenInUseUsageDescription: '…nearby products / item post location',
    NSPhotoLibraryUsageDescription:      '…attach photos to listings and chats',
    ITSAppUsesNonExemptEncryption:       false,
    // production only:  NSAppTransportSecurity: { NSAllowsArbitraryLoads: false }
  }
}
```
`--type introspect` additionally shows (values redacted):
```
ios.config.googleMapsApiKey: '<redacted — set in .env / EAS>'
// production + two valid pins → NSAppTransportSecurity.NSPinnedDomains.<host>.NSPinnedCAIdentities[]
```

---

## 9. Required EAS environment variables & visibility type

Set these in the EAS **production** environment. `EXPO_PUBLIC_*` variables are **embedded in the client bundle** and are readable by anyone with the app — **never** put private credentials in an `EXPO_PUBLIC_*` var (visibility only controls dashboard readability, not bundling).

| Variable | EAS visibility | Notes |
|---|---|---|
| `APP_ENV=production` | plaintext | Already set via `eas.json` `build.production.env`; no EAS var needed. |
| `EXPO_PUBLIC_API_URL` | plaintext (public, bundled) | **Must be HTTPS.** Host must match the app's real backend. |
| `GOOGLE_MAPS_API_KEY_IOS` | **sensitive** | Embedded in binary; restrict the key to bundle id `com.hanamarket.app` + iOS Maps SDK. |
| `EXPO_PUBLIC_SENTRY_DSN` | plaintext (public, bundled) | DSNs are safe to expose. |
| `EXPO_PUBLIC_SENTRY_ORG` | plaintext | Build-time source-map upload. |
| `EXPO_PUBLIC_SENTRY_PROJECT` | plaintext | Build-time source-map upload. |
| `SENTRY_AUTH_TOKEN` | **secret** | Build/CI only. Never bundled. |
| `API_PIN_SHA256` | sensitive | **Optional.** Leave UNSET for first release, or a verified 44-char base64 SPKI pin. |
| `API_BACKUP_PIN_SHA256` | sensitive | **Optional.** Required alongside a primary pin if pinning is enabled. |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | plaintext (public) | Falls back to a code default if unset. |
| `EXPO_PUBLIC_TERMS_URL` | plaintext (public) | Falls back to a code default if unset. |
| `EXPO_PUBLIC_SUPPORT_EMAIL` | plaintext (public) | Falls back to a code default if unset. |

**Classification key:** *plaintext* = not confidential; *sensitive* = hidden in dashboard, still available to builds (and, for `EXPO_PUBLIC_*`, still bundled); *secret* = write-only, build-time only, never bundled.

Commands (do **not** paste real secret values into shell history on shared machines; use `--type file` or the EAS dashboard for secrets):
```bash
# List what's currently set
eas env:list --environment production

# Plaintext / public
eas env:create --environment production --name EXPO_PUBLIC_API_URL --value "https://<api-host>/api" --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_SENTRY_DSN --value "<dsn>" --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_SENTRY_ORG --value "<org>" --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_SENTRY_PROJECT --value "<project>" --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_PRIVACY_POLICY_URL --value "https://…" --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_TERMS_URL --value "https://…" --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_SUPPORT_EMAIL --value "…@…" --visibility plaintext

# Sensitive
eas env:create --environment production --name GOOGLE_MAPS_API_KEY_IOS --value "<ios-maps-key>" --visibility sensitive

# Secret
eas env:create --environment production --name SENTRY_AUTH_TOKEN --value "<token>" --visibility secret

# Certificate pinning — RECOMMENDED: leave BOTH UNSET for the first release.
# The plugin now activates pinning ONLY when TWO valid 44-char base64 pins are
# present, so a partial/placeholder config can never lock users out. Set these
# only once you have TWO VERIFIED pins (primary + backup) from the production
# certificate chain, generated with the openssl command in .env.example:
#   eas env:create --environment production --name API_PIN_SHA256 --value "<44-char-base64>" --visibility sensitive
#   eas env:create --environment production --name API_BACKUP_PIN_SHA256 --value "<44-char-base64>" --visibility sensitive
```

> ⚠️ The malformed placeholder pins currently in local `.env` must **not** be copied into the EAS production environment. Leave both unset for release 1.

---

## 10. Apple / EAS credentials strategy

- **Distribution certificate + provisioning profile:** EAS-managed. On the first `eas build -p ios --profile production`, accept EAS's offer to generate them. No manual certificate handling.
- **Push (APNs):** EAS-managed APNs key (generated on first build when `expo-notifications` is detected). Do **not** create certificate-based APNs SSL certs manually.
- **App Store Connect submission:** interactive for the first release (`eas submit -p ios`). To automate later, create an App Store Connect API key (Users and Access → Integrations → App Store Connect API), download the `.p8` (already gitignored via `asc-api-key*.p8`), and add `ascApiKeyPath`/`ascApiKeyId`/`ascApiIssuerId` back into `eas.json` `submit.production.ios` — **do not commit the IDs or the `.p8`.**

---

## 11. Remaining blockers before the first iOS build

1. **Install and log in to EAS CLI** (not installed locally): `npm i -g eas-cli` then `eas login`.
2. **Decide on certificate pinning.** Recommended: leave `API_PIN_SHA256` / `API_BACKUP_PIN_SHA256` **unset** in production for the first release. Do **not** promote the current placeholder `.env` values. (Plugin now ignores invalid pins as a safety net.)
3. **Set production env vars** (§9) — at minimum `EXPO_PUBLIC_API_URL` (HTTPS) and `GOOGLE_MAPS_API_KEY_IOS`; the build now fails fast without them.
4. **Confirm** the App Store Connect app record uses bundle id `com.hanamarket.app` and that the Apple team is correct.
5. **Icon (BLOCKER):** replace `assets/images/icon.png` (currently **1027×1027, RGBA/alpha**) with a **1024×1024, fully opaque (no alpha channel)** PNG. Do not redesign the artwork — same design, correct dimensions and no transparency. Exact requirement: square, 1024×1024 px, 24-bit RGB (no alpha), sRGB, no rounded corners (iOS masks them). Place it at the same path so no config change is needed.
6. (Recommended, non-blocking) resolve the double lock file (remove `yarn.lock`) and `expo-network` version drift.

---

## 12. Exact first-build commands

```bash
# 0. One-time
npm i -g eas-cli
eas login
eas whoami

# 1. Sanity — public config + health
npx expo config --type public
npx expo-doctor
npx expo install --check
eas env:list --environment production      # confirm §9 vars are set

# 2. Build iOS production (EAS will offer to create signing creds + APNs key)
#    Uses the dedicated production-ios profile (extends production, selects the
#    EAS production environment in-profile) — see §B.1. Android build unaffected.
eas build --platform ios --profile production-ios
```

## 13. Exact TestFlight submission commands

```bash
# Submit the build produced above (interactive auth on first run)
eas submit --platform ios --profile production
#   → choose "select a build from EAS" (or --latest), authenticate,
#     and pick the App Store Connect app (com.hanamarket.app).
```
Then in App Store Connect → TestFlight: the build appears after Apple processing (5–30 min). Because `ITSAppUsesNonExemptEncryption: false` is set, there is **no** "Missing Compliance" prompt. Add internal testers and test.

---

## 14. Rollback instructions

All changes are confined to three tracked files and are trivially reversible:

```bash
# Revert everything done in this task (keeps the user's pre-existing baseline edits intact
# only if they were already staged/committed; otherwise this reverts the whole working file):
git checkout -- app.config.ts plugins/with-network-security.js eas.json
```
Targeted rollback of individual items:
- **Re-add a permission string:** restore the `NSCameraUsageDescription` / `NSPhotoLibraryAddUsageDescription` line in `app.config.ts` `infoPlist`.
- **Disable the iOS validation guard:** delete the `isIosProductionBuild` block in `app.config.ts`.
- **Restore old pin behavior:** revert `withNetworkSecurityIos` in the plugin (not recommended — reintroduces lockout risk).
- **Re-enable API-key submit:** put `ascApiKeyPath`/`ascApiKeyId`/`ascApiIssuerId` back in `eas.json`.

A published TestFlight/App Store build cannot be "un-uploaded"; to recover from a bad release, submit a new higher build number or (for a live App Store version) use **Remove from Sale** / expire the version in App Store Connect.

---

## 15. Future iOS release & upgrade guide

### Per-release flow (e.g. 1.0.0 → 1.0.1)
1. **Bump the marketing version** in `app.json` → `expo.version` (e.g. `"1.0.1"`). This is the user-visible version. Do **not** set an iOS `buildNumber` — it stays remote/auto.
2. **Native deps** — only when adding/upgrading a native module or bumping the Expo SDK:
   - `npx expo install --check` (align versions to the SDK)
   - `npx expo-doctor` (must pass)
   - Review the Expo SDK compatibility notes / changelogs for anything you bump.
3. Keep `cli.appVersionSource = remote` and `production.autoIncrement = true` — EAS assigns the next iOS **build number** (2, 3, 4…) automatically. **Never reuse an already-uploaded build number.**
4. **Verify production env before every release:** `eas env:list --environment production` — confirm `EXPO_PUBLIC_API_URL` (HTTPS), `GOOGLE_MAPS_API_KEY_IOS`, Sentry vars, and pin decision.
5. **Build:** `eas build --platform ios --profile production-ios`.
6. **Submit:** `eas submit --platform ios --profile production`.
7. In App Store Connect: create the new version (marketing version `1.0.1`), **select the processed build**, write **release notes**, answer the (pre-answered) export-compliance question, and **Submit for Review**.
8. **Rejected build:** read the resolution note, fix, bump `expo.version` only if the marketing version must change (a new build number alone is enough for most re-submissions), rebuild, resubmit. You can also reply in Resolution Center.
9. **Roll back safely:** you cannot delete a live version, but you can (a) submit a fixed higher build, (b) **Remove from Sale**, or (c) use phased release / expire the version. Keep the previous working build available in TestFlight.

### Distinguish the two numbers
- **Marketing version** (`expo.version`, e.g. `1.0.1`) — what users see; you edit it manually.
- **Build number** (iOS `CFBundleVersion`, e.g. `2, 3, 4…`) — internal, **remote + auto-incremented by EAS**; must be unique and monotonic per marketing version.

### Credential / secret rotation
- **Google Maps (iOS):** create the new restricted key, `eas env:update --environment production --name GOOGLE_MAPS_API_KEY_IOS …`, rebuild, ship, then revoke the old key.
- **Sentry:** rotate DSN via `eas env:update … EXPO_PUBLIC_SENTRY_DSN`; rotate `SENTRY_AUTH_TOKEN` (secret) any time — it only affects builds.
- **API URL:** update `EXPO_PUBLIC_API_URL`; if pinning is enabled, update pins **first** (see below).
- **APNs:** managed by EAS — rotate via `eas credentials` (iOS → Push Key).
- **Distribution cert / provisioning profile:** rotate via `eas credentials` (EAS regenerates).
- **Certificate pinning — critical ordering:** pins are tied to the backend TLS certificate's public key. **Before the backend rotates its certificate**, ship an app update whose pin set contains **both** the current and the next SPKI hash (that's what the backup pin is for). Only after users have that update should the server switch certs. If you skip this, pinned clients lose all API access. Generate a pin with:
  ```bash
  openssl s_client -servername <host> -connect <host>:443 </dev/null \
    | openssl x509 -pubkey -noout \
    | openssl pkey -pubin -outform der \
    | openssl dgst -sha256 -binary | base64
  ```
  Each pin must be exactly 44 base64 characters. The plugin ignores anything else.

### Reusable release checklist
- [ ] `expo.version` bumped (marketing version)
- [ ] `npx expo install --check` clean (if deps changed)
- [ ] `npx expo-doctor` passes
- [ ] `eas env:list --environment production` verified (API URL HTTPS, Maps key, Sentry, pin decision)
- [ ] Pins updated **before** any backend cert rotation (if pinning enabled)
- [ ] `eas build --platform ios --profile production-ios`
- [ ] `eas submit --platform ios --profile production`
- [ ] Build selected in App Store Connect; release notes written
- [ ] Export compliance confirmed (auto via `ITSAppUsesNonExemptEncryption:false`)
- [ ] Submitted for review; previous build retained for rollback
- [ ] Build number is new (never reused)
