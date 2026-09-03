/**
 * Expo config plugin: Android release signing.
 *
 * Why this exists:
 *   The release signing config used to live directly in `android/app/build.gradle`
 *   and `android/gradle.properties`, both of which are generated files —
 *   `expo prebuild --clean` wipes them, and the next release build silently
 *   falls back to `signingConfigs.debug`. An APK/AAB signed with the debug key
 *   cannot be uploaded as an update to an existing Play listing.
 *
 *   This plugin re-applies the config on every prebuild, so the native folder
 *   stays disposable.
 *
 * Inputs (from app.config.js, which reads them out of `.env`):
 *   storeFile      — path to the keystore, relative to the project root
 *                    (e.g. "credentials/my-hana-release-key.jks"). Keep it
 *                    OUTSIDE `android/`, or `--clean` deletes the key itself.
 *   keyAlias       — alias inside the keystore
 *   storePassword  — keystore password
 *   keyPassword    — key password (usually the same)
 *
 * The plugin no-ops when any of them is missing, so a developer without the
 * release key can still prebuild and run a debug build.
 *
 * Where the secrets end up:
 *   `android/gradle.properties`, which is gitignored — the same place they were
 *   before, only now written from `.env` instead of by hand. Nothing secret is
 *   added to a tracked file.
 */

const { withAppBuildGradle, withGradleProperties } = require('@expo/config-plugins')
const path = require('path')

const PROPS = {
  storeFile: 'MYAPP_RELEASE_STORE_FILE',
  storePassword: 'MYAPP_RELEASE_STORE_PASSWORD',
  keyAlias: 'MYAPP_RELEASE_KEY_ALIAS',
  keyPassword: 'MYAPP_RELEASE_KEY_PASSWORD',
}

// Gradle's `file()` inside android/app resolves relative to that folder.
const toGradlePath = (projectRelative) =>
  path.posix.join('../..', projectRelative.split(path.sep).join('/'))

// One `key=value` line per credential, replacing any earlier copy of it.
const withSigningProperties = (config, props) =>
  withGradleProperties(config, (cfg) => {
    const values = {
      [PROPS.storeFile]: toGradlePath(props.storeFile),
      [PROPS.storePassword]: props.storePassword,
      [PROPS.keyAlias]: props.keyAlias,
      [PROPS.keyPassword]: props.keyPassword,
    }
    cfg.modResults = cfg.modResults.filter(
      (item) => !(item.type === 'property' && item.key in values),
    )
    for (const [key, value] of Object.entries(values)) {
      cfg.modResults.push({ type: 'property', key, value })
    }
    return cfg
  })

// The `release` signingConfig itself, plus pointing the release build type at it.
const withSigningGradle = (config) =>
  withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents

    if (!contents.includes('signingConfigs.release')) {
      // Add the release config right after the generated debug one.
      contents = contents.replace(
        /(signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?\}\n)/,
        `$1        release {
            storeFile file(${PROPS.storeFile})
            storePassword ${PROPS.storePassword}
            keyAlias ${PROPS.keyAlias}
            keyPassword ${PROPS.keyPassword}
        }
`,
      )

      // The generated release build type signs with the debug key; repoint it.
      contents = contents.replace(
        /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
        '$1signingConfig signingConfigs.release',
      )
    }

    cfg.modResults.contents = contents
    return cfg
  })

/** Applies the release signing config to the generated Android project. */
module.exports = function withReleaseSigning(config, props = {}) {
  const { storeFile, storePassword, keyAlias, keyPassword } = props

  if (!storeFile || !storePassword || !keyAlias || !keyPassword) {
    console.warn(
      '[with-release-signing] skipped: set ANDROID_RELEASE_STORE_FILE, ' +
        'ANDROID_RELEASE_KEY_ALIAS, ANDROID_RELEASE_STORE_PASSWORD and ' +
        'ANDROID_RELEASE_KEY_PASSWORD in .env to sign release builds. ' +
        'Debug builds are unaffected.',
    )
    return config
  }

  return withSigningGradle(withSigningProperties(config, props))
}
