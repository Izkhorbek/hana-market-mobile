# Client-Side Product Image Resize/Compress — Implementation Report

**Goal:** shrink product image uploads and improve reliability, with **no backend / contract / create-flow changes**.
**Basis:** `docs/mobile-image-upload-audit.md`.
**Date:** 2026-07-01
**Status:** Implemented. Changed files pass `tsc` + `eslint`. Not committed.

## Files changed
| File | Change |
|------|--------|
| `utils/resizeImageForUpload.ts` | **New.** Helper that downscales (longest edge ≤1600, never upscales) and applies a single JPEG compression (0.82) via `expo-image-manipulator`; fails open (returns original uri on error). |
| `components/FormElements/ImageUploader.tsx` | Picker `quality: 0.8 → 1` (avoid double encode); replaced the parallel `forEach` upload with a **sequential** loop that resizes each asset, swaps the preview to the resized file, then uploads it via the existing draft path. |
| `package.json` / `package-lock.json` | Added dependency (below). |

**Untouched (per rules):** backend, `/product/images/upload-draft` contract, product-create flow (`images_json` / `draft_uuid`s), `RemoteImage`/display code, chat/image paths, avatar path. Change is localized to the product image upload pipeline.

## Installed dependency
- **`expo-image-manipulator@~14.0.8`** — the Expo SDK 54–compatible version (resolved by `expo install`). First-party Expo module; no third-party image libraries added. Uses the current context API (`ImageManipulator.manipulate(uri).resize(...).renderAsync()` → `saveAsync({ compress, format: SaveFormat.JPEG })`), not the deprecated `manipulateAsync`.
- ⚠️ Native module → **a new dev/EAS build is required** (`expo run:*` / `eas build`); it cannot be delivered to an existing dev client via OTA.

## Final resize parameters
```
Max longest edge:   1600 px   (downscale only — never upscales)
JPEG quality:       0.82
Format:             JPEG (SaveFormat.JPEG)
Picker quality:     1         (single compression happens in the helper)
Skip dimension resize when:  max(width, height) <= 1600  (compress-only pass)
Unknown dimensions:          skip resize (compress-only) to avoid upscaling
Concurrency:        sequential — one decode/upload at a time
Error handling:     fail open — return original uri, path-free warn (IMAGE_RESIZE_FAILED)
Field name / MIME:  unchanged — `images` / `image/jpeg`
```

## Upload size before/after (estimate, from audit)
1600px @0.82 typically lands ~300–500 KB.

| Original | After | Reduction |
|---|---|---|
| 3 MB | ~300–450 KB | ~85–90% |
| 5 MB | ~350–500 KB | ~90% |
| 8 MB | ~400–600 KB | ~92–95% (now comfortably under the backend 5 MB/image limit) |

A 5-image listing drops from ~15–40 MB to ~1.5–2.5 MB.

## Validation
- `npx eslint utils/resizeImageForUpload.ts components/FormElements/ImageUploader.tsx` → **0 errors, 0 warnings**.
- `npx tsc --noEmit` → the **only** error is pre-existing and unrelated to this task: `components/Maps/ProductMapMarker.tsx(48,27): Property 'description' does not exist on type 'MarkerData'` (map code being edited separately; `MarkerData.description` was removed while `ProductMapMarker` still reads it). **Both files changed by this task type-check clean.** This map break is outside the product-upload scope and was intentionally not modified — it must be resolved in the map work (restore `description?: string` on `MarkerData`, or drop the prop in `ProductMapMarker`).

## Manual QA checklist (run on a real device after a native rebuild)
- [ ] Select 1 product image → preview shows → upload succeeds → draft_uuid set.
- [ ] Select 5 images → each resizes/uploads **sequentially** (spinners clear one-by-one).
- [ ] Large ~8 MB photo → uploads successfully (now <5 MB), no backend rejection.
- [ ] Android physical device (incl. a low-RAM device — no OOM with 5 large images).
- [ ] iOS HEIC gallery photo → converts + resizes + uploads (picker emits JPEG; helper compresses).
- [ ] Resize-failure fallback → force an error → original uri still uploads (or existing error UI shows); no crash.
- [ ] Product create still sends **only** `images_json` (draft_uuids) — no image bytes at create time.
- [ ] Existing preview + remove (delete draft) still works; `X/maxImages` count intact.
- [ ] Visual quality acceptable on the `?w=1080` detail view for electronics / car / document photos.

## Remaining risks
1. **Native rebuild required** — the added module won't run in the current dev client until rebuilt; verify on a fresh build.
2. **`yarn.lock` not updated** — installed via `npm` (yarn binary not on PATH here), so `package-lock.json` was updated but `yarn.lock` was not. If the team/CI uses yarn, run `yarn add expo-image-manipulator@~14.0.8` (or `yarn install`) to sync the lockfile.
3. **Preview swap flicker** — the preview switches from the original uri to the resized file mid-flow; it's hidden under the uploading overlay, but a brief reload is possible.
4. **Deep pinch-zoom** — masters are now capped at 1600px; extreme zoom on text-heavy items (documents/VIN) has less headroom. Bump `MAX_EDGE` to 2048 if that surfaces.
5. **PNG transparency** — output is forced JPEG; a transparent PNG would be flattened. Marketplace photos are photographic, so low risk; add alpha detection only if needed.
6. **Index-based status updates during in-flight removal** — pre-existing behavior (unchanged): removing an image mid-upload can misalign index-keyed status writes. Sequential processing narrows but doesn't eliminate this; left as-is to keep the change localized.
7. **Unrelated tsc break** (map `ProductMapMarker.description`) currently fails a project-wide typecheck — must be fixed in the map work before release.
