# Image-Resize Release Review — Blocker Resolution

**Scope:** resolve the two remaining release blockers before committing the client-side product image resize work (`docs/mobile-image-upload-resize-fix-report.md`). No image-upload refactor, no resize-param changes, no backend/auth changes.
**Date:** 2026-07-01
**Status:** Blockers resolved. `tsc` + `eslint` green. Not committed.

## 1. TypeScript blocker — FIXED
**Symptom (as reported):** `ProductMapMarker.tsx` read `marker.description` after `MarkerData.description` was removed → `TS2339`.

**Findings on inspection:**
- `components/Maps/ProductMapMarker.tsx` — the stale `description={marker.description}` prop had **already been removed** (the `<Marker>` now passes only `title`); no `description` reference remains.
- `components/Maps/GoogleMap.tsx` — `MarkerData` has **no** `description` field (intentionally removed).
- `components/Maps/MarkerDetailModal.tsx` — does **not** read `description`.
- `app/(tabs)/map.tsx` — the highlighted "target-location" marker literal still **wrote** `description: 'Opened from product detail'`, a field `MarkerData` no longer declares (compiled, but dead/misleading — a latent footgun).

**Fix chosen — remove the stale usage (not restore the field). Why this is the safer option:**
- Nothing consumes `description` anywhere: the modal doesn't read it, and `ProductMapMarker` no longer renders a native callout that would show it. Restoring `description?: string` on `MarkerData` would re-introduce an **unused** field and keep the dead assignment — more surface, against the direction the code was intentionally moved.
- Removing the orphaned write is **behavior-neutral** (the target-location pin renders identically — title only) and makes the data model self-consistent (the type and its call sites agree).

**Change:** deleted the single `description: 'Opened from product detail',` line from the `highlightedMarker` literal in `app/(tabs)/map.tsx`. Minimal, map-local, no UI change.

## 2. Files changed (this review)
| File | Change |
|------|--------|
| `app/(tabs)/map.tsx` | Removed the orphaned `description` property from the `highlightedMarker` object literal. |

(No change needed to `ProductMapMarker.tsx` / `GoogleMap.tsx` / `types/index.ts` — already consistent.)

## 3. Lockfile status — CONSISTENT
| Artifact | `expo-image-manipulator` | Notes |
|---|---|---|
| `package.json` | `~14.0.8` | dependency present |
| `package-lock.json` | `14.0.8` (resolved) | tracked in git, in sync |
| `yarn.lock` | `14.0.8` (resolved) | tracked in git, **in sync** |

- The repo tracks **both** `package-lock.json` and `yarn.lock` (a **pre-existing** dual-lockfile setup, not introduced here). Both were verified to already contain `expo-image-manipulator@14.0.8` matching `package.json`.
- **No lockfile was deleted** (per rules). Recommendation (non-blocking): standardize on a single package manager to avoid future drift — but that's a separate decision and should not be done without approval.

## 4. Validation result
- `npx tsc --noEmit` → **clean** (0 errors). The previously-reported map break no longer appears.
- `npx eslint app/(tabs)/map.tsx components/Maps/ProductMapMarker.tsx` → **0 errors, 0 warnings** (only the benign `MODULE_TYPELESS_PACKAGE_JSON` node notice).
- Image-upload files from the prior task (`utils/resizeImageForUpload.ts`, `components/FormElements/ImageUploader.tsx`) were already validated clean and are untouched here.

## 5. Native rebuild required? — YES
`expo-image-manipulator` is a **native module**. It cannot be delivered to the existing dev client via OTA — a new build is required before the resize path will run:
- Dev: `npm run android` / `npm run ios` (`expo run:*`).
- Release: `eas build` (preview/production profiles).
JS-only OTA updates over an old binary will crash/no-op on the native call.

## 6. Manual QA checklist (run on a real device after the native rebuild)
Image upload (core of the release):
- [ ] Select 1 product image → preview shows → upload succeeds (draft_uuid set).
- [ ] Select 5 images → sequential resize/upload (spinners clear one-by-one; no OOM on low-RAM Android).
- [ ] ~8 MB photo → uploads successfully (now <5 MB, no backend rejection).
- [ ] iOS HEIC gallery photo → converts + resizes + uploads.
- [ ] Force a resize failure → original still uploads / existing error UI shows; no crash.
- [ ] Product create still sends **only** `images_json` (draft_uuids).
- [ ] Existing preview + remove (delete draft) still works.

Map regression (touched file):
- [ ] Open map from a product ("view on map") → target-location pin appears with correct title.
- [ ] Tap a product marker → detail modal opens normally (no crash from the removed field).

## 7. Commit recommendation
**Recommended to commit.** Both release blockers are cleared: the TypeScript error is resolved (project `tsc` is green) and lockfiles are consistent for the new dependency. Suggested split for a clean history:
- Commit 1 (feature): `expo-image-manipulator` dependency + `utils/resizeImageForUpload.ts` + `components/FormElements/ImageUploader.tsx` (+ both lockfiles).
- Commit 2 (fix): `app/(tabs)/map.tsx` — remove orphaned `MarkerData.description` write.

**Before tagging a release:** produce a **native build** (§5) and complete the QA checklist (§6). Not auto-committed, as requested.

## Out of scope / untouched (per rules)
Image-upload logic and resize params (1600px / q0.82 / JPEG), backend, upload contract, product-create flow, auth, `RemoteImage`/display, chat, and unrelated UI were not modified.
