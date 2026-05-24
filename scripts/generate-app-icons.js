/**
 * Regenerate every app icon / splash asset from a single source logo.
 *
 * Why a script:
 *   App stores require very specific dimensions, opacity rules, and safe-area
 *   padding that hand-crafted exports tend to get wrong. Centralising it here
 *   means a brand change is "swap logo.png + run script" instead of touching
 *   half a dozen files in Photoshop.
 *
 * Outputs (all in assets/images/):
 *   - icon.png                       1024x1024  iOS App Store icon (NO alpha — Apple rejects transparent PNGs)
 *   - splash-icon.png                1024x1024  Centered logo on transparent bg, used by expo-splash-screen
 *   - android-icon-foreground.png     512x512   Inner ~66% safe area (Android adaptive icon spec)
 *   - android-icon-monochrome.png     512x512   Single-colour silhouette for Android 13+ themed icons
 *   - android-icon-background.png     512x512   Solid brand background colour (existing colour kept)
 *   - favicon.png                      48x48    Web favicon
 *
 * Usage:  node scripts/generate-app-icons.js
 */

const path = require('path')
const fs = require('fs')
const sharp = require('sharp')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'assets/images/icon.png')
const SPLASH_SRC = path.join(ROOT, 'assets/images/splash-wordmark.svg')
const OUT = path.join(ROOT, 'assets/images')

// Brand background — taken from app.json adaptiveIcon.backgroundColor.
// Adjust here AND in app.json together.
const BG_HEX = '#E6F4FE'

const hexToRgba = (hex, alpha = 1) => {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  return { r, g, b, alpha }
}

if (!fs.existsSync(SRC)) {
  console.error(`Source logo not found: ${SRC}`)
  process.exit(1)
}

if (!fs.existsSync(SPLASH_SRC)) {
  console.error(`Splash source not found: ${SPLASH_SRC}`)
  process.exit(1)
}

(async () => {
  // const srcMeta = await sharp(SRC).metadata()
  // console.log(`Source: ${path.basename(SRC)} ${srcMeta.width}x${srcMeta.height}`)

  // 1) iOS App Store icon — 1024x1024, opaque, logo fits inner 80%
  // App Store explicitly forbids transparency on the marketing icon.
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: hexToRgba(BG_HEX),
    },
  })
    .composite([
      {
        input: await sharp(SRC).resize(820, 820, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
        gravity: 'center',
      },
    ])
    .flatten({ background: hexToRgba(BG_HEX) })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, 'icon.png'))
  // console.log('  -> icon.png (1024x1024 opaque)')

  // 2) Splash logo — transparent wordmark so only the text sits on the splash background.
  await sharp(SPLASH_SRC)
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, 'splash-icon.png'))

  // 3) Android adaptive icon foreground — 512x512, logo in inner 66% safe area
  // (Android crops the outer 33% for various mask shapes — circle, squircle, etc.)
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp(SRC).resize(340, 340, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
        gravity: 'center',
      },
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, 'android-icon-foreground.png'))

  // // 4) Android adaptive icon background — 512x512 solid colour
  // await sharp({
  //   create: {
  //     width: 512,
  //     height: 512,
  //     channels: 4,
  //     background: hexToRgba(BG_HEX),
  //   },
  // })
  //   .png({ compressionLevel: 9 })
  //   .toFile(path.join(OUT, 'android-icon-background.png'))
  // console.log('  -> android-icon-background.png (512x512 solid)')

  // 5) Android 13+ monochrome icon — 512x512, white silhouette on transparent.
  // Themed icons require a single-colour layer; we threshold and recolour
  // the source so it renders correctly when the OS tints it.
  // await sharp(SRC)
  //   .resize(340, 340, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  //   .extract({ left: 0, top: 0, width: 340, height: 340 })
  //   .ensureAlpha()
  //   // Convert all visible pixels to solid white; OS will tint at runtime.
  //   .composite([
  //     {
  //       input: Buffer.from(
  //         `<svg width="340" height="340"><rect width="340" height="340" fill="white"/></svg>`,
  //       ),
  //       blend: 'in',
  //     },
  //   ])
  //   .extend({
  //     top: 86, bottom: 86, left: 86, right: 86,
  //     background: { r: 0, g: 0, b: 0, alpha: 0 },
  //   })
  //   .png({ compressionLevel: 9 })
  //   .toFile(path.join(OUT, 'android-icon-monochrome.png'))

  // 6) Favicon — 48x48, opaque background to look good in browser tabs
  await sharp(SRC)
    .resize(40, 40, { fit: 'contain', background: hexToRgba(BG_HEX) })
    .extend({
      top: 4, bottom: 4, left: 4, right: 4,
      background: hexToRgba(BG_HEX),
    })
    .flatten({ background: hexToRgba(BG_HEX) })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, 'favicon.png'))
  console.log('  -> favicon.png (48x48 opaque)')
})()
