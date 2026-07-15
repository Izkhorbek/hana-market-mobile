/**
 * Expo config plugin: Network security + optional certificate pinning.
 *
 * Why this exists:
 *   Disabling cleartext at the manifest level (already done via
 *   `usesCleartextTraffic: false` in app.config.ts) is necessary but not
 *   sufficient for production. To get a real defense against MITM and rogue
 *   intermediate CAs, we need:
 *     • Android: a `network_security_config.xml` referenced from AndroidManifest
 *       that pins the API host to a known SPKI-SHA256 hash.
 *     • iOS: `NSPinnedDomains` in Info.plist (iOS 14+, declarative, works with
 *       URLSession which RN's networking sits on top of).
 *
 *   Doing this declaratively means we never touch the JS networking layer —
 *   axios, SignalR, and any future fetch() calls are all protected without
 *   custom adapters or extra dependencies.
 *
 * Inputs (all optional; plugin no-ops in dev when API_HOST is unset):
 *   apiHost              — bare hostname, e.g. "api.hanamarket.uz"
 *   apiProtocol          — URL protocol for the API host, e.g. "https:" or "http:"
 *   pinSha256            — primary SPKI SHA-256, base64 (e.g. "AAAA...=")
 *   backupPinSha256      — backup pin, REQUIRED by Apple guidelines so that
 *                          rotating the leaf cert doesn't brick the app.
 *   allowDevCleartext    — when true, local non-production endpoints can use
 *                          plain HTTP.
 *
 * Generating pins:
 *   openssl s_client -servername <host> -connect <host>:443 </dev/null \
 *     | openssl x509 -pubkey -noout \
 *     | openssl pkey -pubin -outform der \
 *     | openssl dgst -sha256 -binary | base64
 */

const {
  withAndroidManifest,
  withDangerousMod,
  withInfoPlist,
} = require('@expo/config-plugins')
const fs = require('fs')
const path = require('path')

const NSC_FILENAME = 'network_security_config.xml'

function buildAndroidNscXml({
  apiHost,
  apiProtocol,
  pinSha256,
  backupPinSha256,
  allowDevCleartext,
}) {
  const pins = [pinSha256, backupPinSha256]
    .filter(Boolean)
    .map((pin) => `            <pin digest="SHA-256">${pin}</pin>`)
    .join('\n')

  const pinSetBlock = pins
    ? `        <pin-set expiration="2030-01-01">
${pins}
        </pin-set>`
    : ''

  const isCleartextApiHost = allowDevCleartext && apiProtocol === 'http:' && apiHost

  const apiDomainConfig = apiHost
    ? isCleartextApiHost
      ? `    <!-- Non-production local API host: allow exact cleartext endpoint only. -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">${apiHost}</domain>
    </domain-config>`
      : `    <!-- Production API: HTTPS only, pinned to known SPKI hash(es). -->
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">${apiHost}</domain>
${pinSetBlock}
    </domain-config>`
    : ''

  const devCleartextConfig = allowDevCleartext
    ? `    <!-- Local development backends only. Not present in release builds. -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>`
    : ''

  const baseConfig = `    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>`

  return `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
${baseConfig}
${apiDomainConfig}
${devCleartextConfig}
</network-security-config>
`
}

function withNetworkSecurityAndroid(config, opts) {
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const resXmlDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml',
      )

      fs.mkdirSync(resXmlDir, { recursive: true })
      fs.writeFileSync(
        path.join(resXmlDir, NSC_FILENAME),
        buildAndroidNscXml(opts),
        'utf8',
      )

      return cfg
    },
  ])

  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0]
    if (app && app.$) {
      app.$['android:networkSecurityConfig'] = '@xml/network_security_config'
    }
    return cfg
  })

  return config
}

// A valid SPKI-SHA256 pin is 32 raw bytes → exactly 44 base64 characters
// (43 payload chars + one "=" pad). Reject anything else. Malformed or
// placeholder pins (wrong length, an "sha256/" prefix, non-base64 filler)
// would otherwise be written verbatim into NSPinnedDomains and permanently
// break TLS to the API — locking every user out of production. Skipping
// pinning is strictly safer than bricking it: HTTPS + ATS still apply.
function isValidSpkiPin(pin) {
  return typeof pin === 'string' && /^[A-Za-z0-9+/]{43}=$/.test(pin)
}

function withNetworkSecurityIos(
  config,
  { apiHost, apiProtocol, pinSha256, backupPinSha256 },
) {
  if (!apiHost || apiProtocol !== 'https:') return config

  const validPins = [pinSha256, backupPinSha256].filter(isValidSpkiPin)

  // Require TWO valid pins before activating. Apple's guidelines mandate a
  // backup pin so that rotating the leaf certificate cannot brick the app;
  // a single pin (or a malformed/partial config) must NOT activate pinning.
  // With fewer than two valid pins we skip entirely — HTTPS + ATS still apply.
  if (validPins.length < 2) {
    if (pinSha256 || backupPinSha256) {
      // eslint-disable-next-line no-console
      console.warn(
        '[with-network-security] iOS certificate pinning skipped: it requires ' +
          'TWO valid 44-character base64 SPKI-SHA256 pins (primary + backup). ' +
          'Fix API_PIN_SHA256 / API_BACKUP_PIN_SHA256 or leave them unset.',
      )
    }
    return config
  }

  return withInfoPlist(config, (cfg) => {
    // Apple requires NSPinnedDomains to live INSIDE NSAppTransportSecurity —
    // a top-level NSPinnedDomains key is ignored by iOS (pinning becomes a
    // silent no-op). Merge into the existing ATS dictionary so the
    // NSAllowsArbitraryLoads:false set by app.config.ts is preserved.
    const ats = { ...(cfg.modResults.NSAppTransportSecurity || {}) }
    ats.NSPinnedDomains = {
      ...(ats.NSPinnedDomains || {}),
      [apiHost]: {
        NSIncludesSubdomains: true,
        NSPinnedCAIdentities: validPins.map((pin) => ({
          'SPKI-SHA256-BASE64': pin,
        })),
      },
    }
    cfg.modResults.NSAppTransportSecurity = ats

    return cfg
  })
}

const withNetworkSecurity = (config, opts = {}) => {
  const apiHost = opts.apiHost || ''
  const apiProtocol = opts.apiProtocol || ''
  const pinSha256 = opts.pinSha256 || ''
  const backupPinSha256 = opts.backupPinSha256 || ''
  const allowDevCleartext = !!opts.allowDevCleartext

  config = withNetworkSecurityAndroid(config, {
    apiHost,
    apiProtocol,
    pinSha256,
    backupPinSha256,
    allowDevCleartext,
  })

  config = withNetworkSecurityIos(config, {
    apiHost,
    apiProtocol,
    pinSha256,
    backupPinSha256,
  })

  return config
}

module.exports = withNetworkSecurity
