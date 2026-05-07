# E2E Testing — Maestro

End-to-end smoke tests that drive the real app on a real device/emulator,
mirroring what a user would do.

## Why Maestro

- **YAML, not code** — flows read like a script: `tapOn`, `inputText`,
  `assertVisible`. No Detox-style native bindings to maintain.
- **Auto-wait built in** — no flaky `sleep()` calls. Maestro retries
  assertions until the timeout.
- **Works on the same APK that ships to users** — no instrumented build
  variant, no JS-side hooks. The app under test is bit-identical to
  production (minus signing key and `APP_ENV=staging`).

## Local setup

### 1. Install Maestro
```bash
# macOS / Linux
curl -Ls "https://get.maestro.mobile.dev" | bash

# Windows (PowerShell)
iwr https://get.maestro.mobile.dev/windows -useb | iex

# Verify
maestro --version
```

### 2. Install the app on a running device/emulator
```bash
# Dev build (with React Native dev menu)
npx expo run:android

# Or a release-style build via EAS
eas build --profile preview --platform android --local
adb install -r build-*.apk
```

### 3. Configure backend test credentials

The auth flow (`01-auth.yaml`) needs the backend to accept a fixed phone +
OTP pair without sending a real SMS. Coordinate with backend to add a
**test-only** phone number:

```
Phone: +998901234567
Fixed OTP: 1234
```

Then either export the env vars or copy `.maestro/.env.example`:
```bash
export E2E_TEST_PHONE=901234567
export E2E_TEST_OTP=1234
```

### 4. Run the suite
```bash
# All flows
npm run e2e

# Just the auth smoke test
npm run e2e:auth

# Generate JUnit report (for CI)
npm run e2e:record
```

## Adding new flows

1. Create `.maestro/flows/NN-name.yaml` (numeric prefix orders execution).
2. Use `testID` selectors over text — text changes per locale and breaks
   tests; `testID`s are invisible to users and stable across translations.
3. To add a `testID` to a component:
   ```tsx
   <TouchableOpacity testID="cart-checkout-btn" onPress={...}>
   ```
4. Verify locally before pushing — CI runs the same flow on a fresh emulator.

## CI

`.github/workflows/e2e.yml` runs the full suite on every PR to `develop`
and `main`. Required secrets:

| Secret | Where to get it |
|---|---|
| `EXPO_TOKEN` | https://expo.dev → Account Settings → Access Tokens |
| `E2E_TEST_PHONE` | The test-only phone configured on the backend |
| `E2E_TEST_OTP` | The fixed OTP returned for that phone |

On failure, Maestro screenshots are uploaded as a workflow artifact for
debugging.

## Current coverage

| File | Scenario |
|---|---|
| `01-auth.yaml` | Welcome → phone → OTP → home screen |
| `02-home-fab.yaml` | Home → tap "+ Post" → bottom sheet appears |

### Roadmap (add as the app grows)
- [ ] `03-create-listing.yaml` — text-only listing creation
- [ ] `04-chat.yaml` — open a listing, message the seller, assert delivery
- [ ] `05-language-switch.yaml` — uz → ru → en, verify strings change
- [ ] `06-account-deletion.yaml` — full purge flow, verify re-signup works

## Why not Detox?

Detox is faster and supports JS-level inspection, but:
- requires a separately-built "instrumented" variant of the app
- needs native iOS/Android changes that conflict with Expo prebuild
- breaks more often on RN/Expo upgrades
- Maestro covers 95% of what we need with 10% of the maintenance

If we ever need pixel-perfect screenshot diffing or millisecond-precise
animation testing, revisit Detox. Until then, Maestro stays.
