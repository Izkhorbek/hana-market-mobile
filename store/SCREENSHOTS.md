# Screenshot Requirements

Capture **the same 6 scenes** in all three locales (en/ru/uz) on each
required device. Drop the resulting PNGs into:

```
store/screenshots/<store>/<locale>/<device>/<NN>-<scene>.png
```

Example: `store/screenshots/ios/en/iphone-67/01-home.png`

## Required device sizes

### Apple App Store (mandatory)
| Slot | Display name | Resolution (portrait) | Min count |
|---|---|---|---|
| `iphone-67` | iPhone 16 Pro Max | 1290 × 2796 | 3 |
| `iphone-65` | iPhone 11 Pro Max | 1242 × 2688 | 3 |
| `iphone-55` | iPhone 8 Plus (legacy, optional) | 1242 × 2208 | optional |
| `ipad-13` | iPad Pro 12.9" (only if "supportsTablet=true") | 2048 × 2732 | 3 |

### Google Play (mandatory)
| Slot | Display name | Resolution | Min count |
|---|---|---|---|
| `phone` | Phone | 1080 × 1920+ (16:9 or taller) | 2 |
| `feature-graphic` | Feature Graphic | 1024 × 500 (no alpha) | 1 |
| `tablet-7` | 7" tablet | 1080 × 1920+ | optional |
| `tablet-10` | 10" tablet | 1080 × 1920+ | optional |

## Shot list (6 scenes)

| # | Scene | Source screen | Caption (en) |
|---|---|---|---|
| 01 | `home` | `app/(tabs)/index.tsx` | Discover what your neighbors are selling |
| 02 | `categories` | `app/categories.tsx` | Browse 20+ categories |
| 03 | `product-detail` | `app/product/[id].tsx` | Detailed listings with photos & maps |
| 04 | `chat` | `app/chat/[id].tsx` | Chat directly with sellers, in real time |
| 05 | `post` | `app/(post)/...` | List your own items in under a minute |
| 06 | `profile` | `app/(settings)/...` | Manage your account in 3 languages |

## Capture workflow

### iOS (simulator)
```bash
# Open simulator at the right device, then for each scene:
xcrun simctl io booted screenshot store/screenshots/ios/en/iphone-67/01-home.png
```

### Android (emulator)
```bash
# Pixel 7 Pro emulator at 1080×2400, then for each scene:
adb exec-out screencap -p > store/screenshots/android/en/phone/01-home.png
```

### Tip: switch app locale per pass
1. Set the app language from in-app **Settings → Language**.
2. Take all 6 shots.
3. Switch language, repeat.

## Feature Graphic (Play Store)

- Size: **1024 × 500 px**, PNG or JPG, **no transparency**.
- Should not contain device frames, prices, or store badges.
- Should fit alongside the app icon — keep important content in the
  centered 750×500 area (sides may be cropped on some surfaces).
- Save to: `store/screenshots/android/feature-graphic.png`.
