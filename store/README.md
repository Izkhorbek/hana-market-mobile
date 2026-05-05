# Store Listing Assets

This directory contains everything required to publish **Hana Market** to the
Google Play Store and the Apple App Store.

```
store/
├── README.md                    ← you are here
├── PRIVACY_POLICY.md            ← host this on a public URL before submitting
├── TERMS_OF_SERVICE.md          ← same — referenced by sign-up screen
├── SCREENSHOTS.md               ← required sizes & shot list
├── metadata/
│   ├── en/                      ← English (default)
│   ├── ru/                      ← Russian
│   └── uz/                      ← Uzbek
│       ├── title.txt
│       ├── short_description.txt   (Play Store, ≤80 chars)
│       ├── subtitle.txt            (App Store, ≤30 chars)
│       ├── full_description.txt    (Play Store, ≤4000 chars)
│       ├── description.txt         (App Store, ≤4000 chars)
│       ├── keywords.txt            (App Store, ≤100 chars, comma-separated)
│       ├── promotional_text.txt    (App Store, ≤170 chars)
│       └── release_notes.txt       (both stores)
└── screenshots/                 ← drop captured PNGs here (see SCREENSHOTS.md)
    ├── android/
    └── ios/
```

## Submission checklist

### Pre-flight (do once)
- [ ] Host `PRIVACY_POLICY.md` and `TERMS_OF_SERVICE.md` on a public HTTPS URL
      (e.g. `https://hanamarket.uz/privacy`, `https://hanamarket.uz/terms`).
- [ ] Update the URLs in `app.config.ts` (`extra.privacyPolicyUrl`, `extra.termsUrl`)
      and inside the in-app Settings screen.
- [ ] Capture screenshots per `SCREENSHOTS.md`.
- [ ] Generate Feature Graphic (1024×500 PNG, no alpha) for Play Store.
- [ ] Generate App Store promotional text and keywords (`metadata/<lang>/`).

### Google Play
- [ ] Create app in Play Console with package `com.asilbek1510.hanamarket`.
- [ ] Fill in Data Safety form (see `PRIVACY_POLICY.md` for the disclosure list).
- [ ] Set Content Rating questionnaire (likely "Everyone" or "Teen").
- [ ] Upload screenshots (min 2, max 8 per device type).
- [ ] Set privacy policy URL in Store Listing → App content.
- [ ] Run `eas submit --profile production --platform android`.

### Apple App Store
- [ ] Create app in App Store Connect with bundle id `com.asilbek1510.hanamarket`.
- [ ] Fill in App Privacy questionnaire (mirror `PRIVACY_POLICY.md`).
- [ ] Set Age Rating (4+ unless chat moderation flags it higher).
- [ ] Upload screenshots for required device sizes (see `SCREENSHOTS.md`).
- [ ] Provide demo account credentials for review (test phone + OTP bypass).
- [ ] Run `eas submit --profile production --platform ios`.

## Why all of this lives in the repo

Store metadata is content, not code, but treating it as code gives:
- diff history when copy changes
- localization parity (3 locale folders, 3 sets of files — easy audit)
- automation hooks (Fastlane-style consumers can read `metadata/<lang>/`)
- single source of truth so PRs that touch user-facing strings can update
  the store listing in the same commit.
