# Mobile Image Upload Pipeline — Architecture Audit

**Scope:** Should the app resize/compress images client-side *before* upload?
**Type:** Audit only — no code changed, no packages installed.
**Date:** 2026-07-01
**Stack:** Expo SDK **54** (`expo ~54.0.32`), React Native 0.81.5, React 19. `expo-image-picker ~17.0.10`, `expo-image ~3.0.11`. **`expo-image-manipulator` is NOT installed.** (`sharp` is only a *devDependency*, used by build scripts — not available at runtime.)

---

## 1. Current upload flow (diagram + every function)

### Product listing images (the path this audit is about)
```
User taps image slot  (ImageUploader.tsx)
        │
        ▼
ImagePicker.launchImageLibraryAsync({           ← gallery ONLY (no camera path exists)
   mediaTypes: 'images',
   allowsEditing: false,        ← no crop
   allowsMultipleSelection: true,
   quality: 0.8 })              ← JPEG re-encode @80%, NO dimension resize
        │  result.assets[].uri  (full-resolution local file)
        ▼
pickImage()  → slice to remaining slots → add to RHF state as {uri, uploading:true}
        │      (local preview rendered from the ORIGINAL asset.uri via RemoteImage)
        ▼
uploadSingleImage(uri, index)   ← runs once PER image, in PARALLEL (forEach)
   new FormData()
   formData.append('images', { uri, type:'image/jpeg', name:`image_*.jpg` })
        │
        ▼
productService.uploadDraftImages(formData)
   POST /product/images/upload-draft   (multipart/form-data)
        │  → { draft_uuid, draft_image_url }
        ▼
RHF field 'images' now holds DraftImageItem[] with draft_uuid
        │
        ▼   (later, on form submit)
CreateThingForm / CreateCarForm / CreateWorksForm  buildFormData:
   formData.append('images_json', JSON.stringify([{ draft_uuid, sort_order }]))
        │      ← NO image bytes here; only the draft references
        ▼
productService.create(formData)  →  POST /product/create
```

**Critical structural fact:** image **bytes are uploaded at pick time** (the draft endpoint), not at product-create time. Product create only sends `draft_uuid`s (`images_json`). **Therefore any client-side resize must happen before the draft upload — i.e. inside `ImageUploader.pickImage`. Resizing at "create product" time would be too late.**

### Functions involved
| Function | File | Role |
|---|---|---|
| `pickImage` | `components/FormElements/ImageUploader.tsx` | permission + `launchImageLibraryAsync`, adds to state, fans out uploads |
| `uploadSingleImage` | same | builds multipart FormData, calls draft upload, tracks per-item status |
| `removeImage` | same | deletes a draft (`deleteDraftImage`) |
| `uploadDraftImages` / `deleteDraftImage` / `create` | `api/services/product.service.ts` | transport (axios multipart) |
| `useUploadDraftImagesMutation`, `useCreateProductMutation` | `api/hooks/useProduct.ts` | React Query wrappers |
| `onSubmit` (`draft_images` map → `images_json`) | `CreateThingForm.tsx` / `CreateCarForm.tsx` / `CreateWorksForm.tsx` | reference drafts on create |

### Adjacent (separate) upload paths — for completeness
- **Avatar:** `app/(settings)/edit-profile.tsx` → `launchImageLibraryAsync({ allowsEditing:true, aspect:[1,1], quality:0.8 })` → **validates type + `blob.size > MAX_FILE_SIZE_BYTES` (5MB)** → `POST /user/upload/profile-image` (field `image`). This path *does* guard size; the product path does **not**.
- **Chat:** no image-upload endpoint exists (per `docs/FIX-PROGRESS.md`); SignalR expects a ready URL. Out of scope.

---

## 2. Current architecture — measured answers

| Question | Answer |
|---|---|
| Are original camera images uploaded? | **Effectively yes.** Full **dimensions** are preserved; only a JPEG quality re-encode (0.8) is applied by the picker. A 12–48MP photo is uploaded at full resolution. |
| Are images already compressed? | Partially — `quality: 0.8` at the picker. But **no downscaling**, so byte size stays large for high-MP sensors. |
| Are HEIC files converted? | **Yes**, incidentally. `expo-image-picker` on iOS returns a JPEG (`.jpg`) when `quality` is set. The app never receives raw HEIC. |
| Is EXIF preserved? | `exif` option is not requested (default off), and the picker's re-encode generally normalizes orientation and drops most metadata. Not guaranteed identical across iOS/Android; GPS EXIF is effectively not propagated. |
| Is any resize already happening? | **No dimension resize.** Nothing calls a manipulator; `expo-image-manipulator` isn't installed. |
| Is duplicate compression happening today? | **No** (single re-encode at the picker). ⚠️ But if a manipulator step is added *without* changing `quality: 0.8`, it becomes a **double JPEG encode** (0.8 → 0.82) and compounds quality loss — see §Weaknesses. |

---

## 3. Expo capabilities

- **`expo-image-manipulator`: not installed.** It is the correct, first-party, safest tool for this on SDK 54 (compatible version **~14.0.x**). Modern API is context-based: `ImageManipulator.manipulate(uri).resize({ width }).renderAsync()` then `saveAsync({ compress, format })` (the old `manipulateAsync` is deprecated but still present).
- **`expo-image` (installed, ~3.0.11):** a **display** component only. It cannot re-encode/save a file for upload — not usable for this.
- **`expo-image-picker` (installed):** can compress (`quality`) but **cannot resize dimensions**. Insufficient alone.
- **Adding `expo-image-manipulator` is a native module** → requires a new dev/EAS build (`expo run:*` / `eas build`); it cannot be delivered to an existing dev client via OTA. This is the only real setup cost.

**Recommendation:** `expo-image-manipulator` (~14.x). No third-party alternative is safer inside managed Expo.

---

## 4. Estimated benefits (1600px longest edge, JPEG q≈0.82)

A 1600px-max JPEG at q0.82 typically lands **~300–500 KB** (photo-dependent).

| Original | Approx. dimensions | After 1600px @0.82 | Reduction |
|---|---|---|---|
| 3 MB | ~4032×3024 (12MP) | ~300–450 KB | **~85–90%** |
| 5 MB | ~12MP high-detail | ~350–500 KB | **~90%** |
| 8 MB | ~48MP / very detailed | ~400–600 KB | **~92–95%** |

- **Upload time:** upload-bound, so time drops ~in proportion to bytes. On a 5 Mbps uplink, a 5MB image ≈ ~8s → ~0.7s; a 5-image listing goes from ~15–40MB (~30–70s) to ~1.5–2.5MB (~3–5s). The win is largest on the weak/rural mobile networks common in the target market.
- **Bandwidth:** ~85–93% per image.
- **Backend storage:** the master/original the server stores shrinks ~85–90% (variants are derived on the fly at `?w=…`, so smaller masters don't hurt display). Server-side resize also does **less work** decoding a 1600px input than a 48MP one (lower CPU/RAM per upload).
- **Reliability (often the biggest real win):** the draft endpoint enforces **≤5MB per image**. High-MP phones can exceed 5MB even at `quality:0.8`, and the product path has **no client-side size guard** → today those uploads fail with `uploadError`. Client resize keeps every image comfortably under the limit.

---

## 5. Quality impact

Display already tops out at **`?w=1080` (detail)** and **`?w=260` (cards)**. A **1600px** master is ≥ both, so normal viewing is **visually identical** — the backend still downscales from a source larger than it serves.

| Category | 1600px @82% acceptable? | Note |
|---|---|---|
| Electronics | ✅ | Fine; model/serial readable at detail size. |
| Cars | ✅ (mostly) | Body/interior great; extreme pinch-zoom onto VIN/odometer is the edge case. |
| Furniture | ✅ | Texture/color fully preserved. |
| Documents / tickets / coupons (cat 119) | ⚠️ | Small dense text at deep zoom is the weakest case. |
| Close-up products | ✅ | 1600px covers close-up detail at normal + detail zoom. |

**Verdict:** for standard browsing and the `w=1080` detail view, users would **not** notice loss. The only theoretical regression is **pinch-to-zoom beyond ~1080px** (the zoom viewer), where a 1600px cap gives ~1.5× headroom instead of a 4000px original. For text-heavy categories a **2048px** master (still ~500–800 KB) is a safe compromise.

---

## 6. Risks

| Area | Risk | Severity / Mitigation |
|---|---|---|
| iOS / HEIC | Picker already emits JPEG; manipulator would receive JPEG. If a HEIC uri ever reaches it, `expo-image-manipulator` decodes HEIC on iOS. | Low. |
| Android | Cross-platform manipulator; consistent behavior. | Low. |
| PNG / transparency | Forcing JPEG **flattens alpha** (transparent → black/white). Marketplace photos are photographic (no alpha), but screenshots/graphics would change. | Low; optionally keep PNG when alpha is detected. |
| Memory | Decoding a 48MP image to a bitmap for resize can spike ~150–250 MB transiently. Current code uploads in **parallel** (`forEach`); resizing 5 images in parallel could OOM low-RAM Androids. | **Medium.** Resize **sequentially / limited concurrency**; rely on native downscale. |
| Large panorama | e.g. 12000×3000 → 1600×400 is tiny, but the **decode** before downscale is the memory risk. | Medium; same mitigation. |
| Older phones | Resize adds a few hundred ms/image, but still far cheaper than uploading the large file. | Low. |
| Camera vs gallery | No camera path exists; all inputs come from the library (which holds camera originals). No divergence to handle. | None. |
| Double compression | Adding manipulator @0.82 on top of picker @0.8 compounds loss. | **Medium — set picker `quality: 1` (or ~0.9) and let the manipulator do the single authoritative compress.** |

---

## 7. Backend compatibility

**No backend changes required. Contract stays identical.** The draft endpoint accepts `multipart/form-data` with field `images` (≤5 files, ≤5MB each). Client resize only changes the *bytes* of each file — same field name, same MIME (`image/jpeg`), same endpoint, same `images_json` create flow. It actually **improves** compliance with the existing 5MB limit.

---

## 8. Future compatibility

| Concern | Impact |
|---|---|
| Backend resize middleware / dynamic `?w=…` variants | ✅ Unaffected — variants derive from the master; 1600px ≥ every requested width (max is 1080), so **no upscaling** of variants. |
| Thumbnail generation (w=260) | ✅ Fine. |
| Detail images (w=1080) | ✅ 1600 ≥ 1080. |
| Zoom viewer | ⚠️ Max zoom fidelity capped at the master size (1600/2048). The only real trade-off. |
| Future WebP | ✅ Not blocked. Manipulator can output WebP (Android solid; iOS limited) if the backend later accepts it; JPEG stays the safe default. |

---

## 9. Recommended architecture

**Option A — resize immediately after the picker returns, inside `ImageUploader.pickImage`, before state/preview/upload.**

Rejected alternatives:
- **Option C (inside the upload service):** couples transport with media processing; the service is shared (e.g. avatar path) and should stay format-agnostic. ✗
- **Option B (just before FormData in `uploadSingleImage`):** works, but on retry it re-resizes, and the preview would show the original while a different (resized) file uploads — a subtle mismatch. ✗

**Why A:** one resized file becomes the single source of truth for **preview + upload + retry**; the transport/service layer stays dumb; and because bytes upload at pick time, this is the natural and only correct insertion point. Concretely: map each selected `asset` through a small `resizeForUpload(uri)` helper (added once), use the returned uri for the preview item and the draft upload. This centralizes the change in the **one component already shared by all three create forms (and the edit forms)**. Run the resize **sequentially / with limited concurrency** to bound memory. Optionally reuse the same helper in the avatar path.

---

## 10. Recommended image parameters

```
Max dimension:  1600 px (longest edge)      // 2048 px if prioritizing document/VIN zoom
JPEG quality:   0.82
Format:         JPEG
Picker change:  set quality: 1 (or ~0.9)     // avoid double-encoding; manipulator owns compression
Skip resize when:
    width  <= 1600  AND  height <= 1600       // then compress-only, or skip entirely if already small & <~1MB
Concurrency:    resize sequentially (or max 1–2 at a time) to cap memory
Transparency:   keep PNG only if alpha is detected (else JPEG)
```

---

## 11. Implementation complexity — **LOW**

- Install `expo-image-manipulator ~14.x` → **requires a new native build** (dev client / EAS), the only non-trivial step.
- Add a ~20-line `resizeForUpload(uri)` helper (resize if over cap, compress, return new uri).
- Wire it into `ImageUploader.pickImage` (map assets before upload); optionally the avatar path.
- Zero backend / contract / API-hook changes.
- Estimated effort: ~0.5 day including iOS+Android+HEIC+low-RAM testing.

---

## 12. Recommendation: **YES**

Client-side resize/compress before upload is **recommended**. It delivers ~85–93% bandwidth/upload-time savings, cuts stored-master size and server resize cost, and — most importantly — fixes silent upload failures for high-MP phones against the existing **5MB** limit (a path that currently has **no client size guard**). Quality impact on normal browsing and the `w=1080` detail view is **negligible** because 1600px ≥ every served variant; the sole caveat is deep pinch-zoom on text-heavy items, mitigated by choosing 1600–2048px at q≥0.82. Complexity is low and the backend contract is untouched.

**Do next (when approved):** add `expo-image-manipulator`, implement `resizeForUpload` in `ImageUploader`, set the picker to `quality: 1`, resize sequentially, and QA on iOS (HEIC), Android low-RAM, a document photo, and a panorama.
