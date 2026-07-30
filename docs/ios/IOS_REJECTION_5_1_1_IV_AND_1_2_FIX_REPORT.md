# iOS App Review Fix Report — Guidelines 5.1.1(iv) & 1.2

**App:** Hana Market (`com.hanamarket.app`)
**Rejected build:** 1.0.1 (8)
**Scope:** Two cited rejections — location permission pre-prompt (5.1.1(iv)) and
explicit EULA/Terms acceptance before authentication (1.2).

---

## 1. Repository state

- **HEAD:** `84e0520` — _"version 10: Add Guest mode…"_
- **Branch:** `develop`
- **Working tree at audit start:** clean.
- **Guest mode:** already present in the repo — **preserved unchanged**. Product
  list, search, product details, and map remain accessible without login.

### Files changed by this fix (6)
```
 app/(auth)/auth.tsx                | 109 +++++-   (Terms acceptance gate)
 app/(auth)/location-permission.tsx | 143 +++-----  (neutral pre-prompt)
 locales/en.json                    |  16 +++--    (new strings)
 locales/ru.json                    |  16 +++--
 locales/uz.json                    |  16 +++--
 modules/Auth/auth-store.ts         |  18 +++      (acceptance record)
```
No changes to Android production config, `app.json`/`app.config.js`, `eas.json`,
dependencies, Expo SDK, Bundle ID, package name, or EAS project.

---

## 2. Apple rejection summary

| Guideline | Apple's finding |
|---|---|
| **5.1.1(iv)** | A custom message appears before the system location prompt. Its button said **"Allow location"**, and a **"Skip for now"** option let users avoid the system permission prompt entirely. |
| **1.2** | Users do not explicitly accept an EULA/Terms that prohibits objectionable content and abusive behavior before registration/login. |

---

## 3. Exact root causes

**5.1.1(iv)** — `app/(auth)/location-permission.tsx` (pre-fix):
- Action button rendered `t('auth.location.allow_button')` = **"Allow Location"** (persuasive wording that mimics the system "Allow").
- A second button `handleSkip` → `t('auth.location.skip_button')` = **"Skip for now"** navigated straight to the tabs **without ever invoking** `requestForegroundPermissionsAsync()`, letting the user bypass the OS decision point.

**1.2** — `app/(auth)/auth.tsx` (pre-fix):
- The phone → OTP authentication flow had **no Terms/EULA acceptance** of any kind. `verifyOtp` implicitly registers a new account on first successful code entry, so users created accounts with zero recorded consent.
- Backend serves Terms/Privacy **text only** (`content.service.ts` → `getTerms`/`getPrivacy`); there is **no acceptance-recording API** and no `terms_accepted` field on the user.

---

## 4. Before / After user flows

### Location permission
**Before:** Welcome → _(Continue as guest / after login)_ → Location screen with
**"Allow Location"** + **"Skip for now"**. "Skip" → tabs, system prompt never shown.

**After:** Welcome → Location screen with a single neutral **"Continue"** button
(no skip). "Continue" → reads current permission → **invokes the native OS prompt
when the OS still allows asking** → proceeds into the tabs whether the user
grants or denies. The native dialog is the sole decision point.

### Terms / EULA
**Before:** Phone → OTP → (implicit account). No consent step.

**After:** On the phone step the user sees a **zero-tolerance policy note** and a
**required, unchecked checkbox**: _"I agree to the Terms of Service and Privacy
Policy"_ with both documents tappable (open in an in-app browser). **Send code is
disabled until the box is checked.** On successful verification the acceptance is
recorded (`termsAcceptedAt`, ISO timestamp, persisted).

---

## 5. Location permission state table

| Current state | `canAskAgain` | On "Continue" | Result |
|---|---|---|---|
| Undetermined (first run) | `true` | **Native prompt shown** | Grant → save location → tabs · Deny → tabs (default-region feed) |
| Denied but askable (mostly Android) | `true` | **Native prompt shown again** | Same as above |
| Permanently denied / blocked | `false` | **No prompt** (prior decision respected) | Proceed to tabs; "Open Settings" is offered later, only when a location-dependent feature is used (in-app empty state) |
| Already granted | — | No prompt (already granted) | Fetch location → save → tabs |

- **No repeated launch prompting:** the screen is only reached via explicit
  onboarding navigation, never automatically on every app launch.
- **Race/double-tap guarded** via an in-flight ref.
- **iOS & Android** handled through `expo-location` `getForegroundPermissionsAsync`
  + `canAskAgain` (the abstraction reports each platform's own state).
- **Guest never trapped:** a denial always still lands the user on the tabs.

---

## 6. Terms / EULA — text & acceptance behavior

- **Checkbox:** required, starts **unchecked**, never pre-checked. Gates "Send code".
- **Links:** "Terms of Service" → `extra.termsUrl` (`https://hana.uz/terms-of-service`),
  "Privacy Policy" → `extra.privacyPolicyUrl` (`https://hana.uz/privacy-policy`),
  opened via `expo-web-browser` (works pre-login).
- **In-app zero-tolerance statement** shown at the point of acceptance
  (`auth.terms.policy_note`, localized uz/ru/en):
  > "Hana Market has zero tolerance for objectionable content and abusive
  > behavior. Violating content may be removed and accounts may be suspended or
  > banned. You can report content you find objectionable."
- **Acceptance record:** `authStore.termsAcceptedAt` (ISO string) set immediately
  after successful OTP verification; persisted via the store's `partialize`.
- **Guest browsing is NOT gated** by Terms acceptance (only authentication is).

---

## 7. Report / Block verification evidence

| Capability | Backend | UI | Status |
|---|---|---|---|
| Report listing/content | `POST complaint/create` (`complaint.service.ts`) | Home feed card ⋯ → `ComplaintModal` (`home.tsx handleReport`) with localized success/error alerts | **WORKS** (reachable from the feed; reaches backend) |
| Report user | `POST report/create` (`report.service.ts`) exists | **No UI wiring** | Backend-only |
| **Block user** | **No endpoint** | **No UI, no enforcement** | **MISSING** |

- Reporting objectionable content is demonstrable end-to-end from the home feed
  and returns a user-visible confirmation.
- `is_blocked` in the codebase is only a **passive inbound admin flag** (whether
  the current account is admin-blocked); it is not a user-to-user block feature.

---

## 8. Backend limitations (must be addressed separately)

1. **No user-block feature (highest priority).** Apple 1.2 for UGC apps commonly
   requires the ability to block abusive users. There is **no backend endpoint,
   no client UI, and no enforcement**. Per project rules ("do not invent a
   feature if backend support does not exist"), this was **not fabricated**.
   → **Recommended task:** add `POST user/block` + `GET blocked-users` +
   server-side enforcement (hide blocked users' listings, suppress their chats),
   then wire a "Block user" action on the seller profile and chat room.
2. **No server-side Terms-acceptance record.** Acceptance is currently client-side
   only. → **Recommended task:** persist acceptance (user id, Terms version,
   timestamp, and IP/device metadata where legally appropriate) via a new
   endpoint or a `terms_accepted` field on verify-otp / profile.
3. **Terms/Privacy web content** (`hana.uz/terms-of-service`, `/privacy-policy`)
   must contain the full zero-tolerance clauses. The app now shows the substance
   in-app at acceptance, but the linked documents should mirror it.
4. **Report reachability** is limited to the home feed. Consider surfacing the
   existing `complaint/create` report action on product detail and chat too.

---

## 9. Android impact assessment

- The only shared files touched are `app/(auth)/location-permission.tsx`,
  `app/(auth)/auth.tsx`, `modules/Auth/auth-store.ts`, and the locale JSONs.
- All changes are **policy-safe on both platforms**: neutral wording, a real
  system permission request, and an explicit consent checkbox are correct on
  Android as well.
- **No** Android manifest, permissions array, Gradle, versionCode, or EAS config
  was modified. Android behavior is unchanged apart from the same improved
  (compliant) onboarding copy and consent gate.

---

## 10. Manual physical-device QA checklist

**Location (fresh install / reset location permission):**
- [ ] Guest: Welcome → "Continue as guest" → Location screen shows **"Continue"**, **no "Skip"**.
- [ ] Tap "Continue" → **native iOS location dialog appears immediately**.
- [ ] Tap "Don't Allow" → app proceeds to the tabs; browsing works (default region).
- [ ] Reopen the app → it does **not** re-prompt automatically.
- [ ] Trigger a location feature (home empty state) → explanation + **"Open Settings"** offered.
- [ ] Grant location → nearby listings load; map centers on the user.

**Terms / EULA:**
- [ ] Login/Register: phone step shows the zero-tolerance note + **unchecked** checkbox.
- [ ] "Send code" is **disabled** until the checkbox is checked.
- [ ] Tap "Terms of Service" and "Privacy Policy" → each opens a readable page.
- [ ] Check the box → "Send code" enables → OTP → account proceeds.

**Moderation:**
- [ ] Home feed → listing ⋯ → **Report** → choose reason → success confirmation.
- [ ] (Known gap) No block action yet — see §8.

**Regression:**
- [ ] Existing user can still log in; guest browsing/search/detail/map all work.
- [ ] `npx tsc --noEmit` → 0 errors. `eslint` (changed files) → 0 errors.

---

## 11. Screen-recording script for Apple (physical device)

1. Launch the app fresh (post-install).
2. Tap **"Continue as guest"**; scroll the product list, open a **product detail**, use **search**, open the **map** — all without logging in.
3. From onboarding, show the **location explanation screen with the "Continue" button** (no skip).
4. Tap **Continue** → the **native iOS location permission dialog appears immediately**; show choosing an option.
5. Go to **Login/Register** (phone step): show the **unchecked Terms checkbox** and that **Send code is disabled**.
6. Tap **"Terms of Service"** → show the page and the **zero-tolerance language**; also show the in-app zero-tolerance note on the auth screen.
7. **Check the box** → Send code enables → enter OTP → authentication proceeds.
8. On a listing, open the **⋯ → Report** action and submit a report.
9. _(If a block feature is shipped per §8, demonstrate Block here.)_
10. Show the **result** (report confirmation) after moderation actions.

---

## 12. App Review Notes (paste into App Store Connect)

> Thank you for your feedback.
>
> Location (5.1.1(iv)): The explanatory screen now uses neutral "Continue"
> wording, has no skip option, and always proceeds directly to the native iOS
> permission request when the system still allows asking. We respect a user's
> denial and never re-prompt; when a location-dependent feature is needed we
> offer "Open Settings". Guests can browse without granting location.
>
> Terms/EULA (1.2): We added an explicit, unchecked Terms of Service & Privacy
> Policy acceptance checkbox before authentication; the "Send code" button is
> disabled until the user agrees. The app states a zero-tolerance policy for
> objectionable content and abusive behavior at the point of acceptance, and
> users can report objectionable content from the listings feed.
>
> An attached physical-device screen recording demonstrates the Terms agreement,
> the native location prompt, and the reporting mechanism.

_(Adjust the reporting/blocking wording to match exactly what ships — see §8 on
the block-feature gap before claiming blocking.)_

---

## 13. Rebuild & resubmission commands

> Do NOT run automatically — these are for the release owner. Increment the iOS
> build number first (rejected build was **(8)** → next **(9)**).

```bash
# 1. Validate locally
npx tsc --noEmit
npm run lint

# 2. Production iOS build (profile "production" in eas.json)
npm run build:ios:production
#   → eas build -p ios --profile production

# 3. Submit the finished build to App Store Connect
eas submit -p ios --latest
```

---

## 14. Validation results (this change)

- `npx tsc --noEmit` → **0 errors**.
- `eslint` (auth.tsx, location-permission.tsx, auth-store.ts) → **0 errors, 0 warnings**.
- `git diff --check` → clean (only a benign LF→CRLF notice).
- Locale JSON (uz/ru/en) → parse OK; new keys present.
