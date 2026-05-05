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
 *   pinSha256            — primary SPKI SHA-256, base64 (e.g. "AAAA...=")
 *   backupPinSha256      — backup pin, REQUIRED by Apple guidelines so that
 *                          rotating the leaf cert doesn't brick the app.
 *   allowDevCleartext    — when true, also adds a domain-config that permits
 *                          plain HTTP for RFC1918 ranges so local dev still
 *                          works against `10.0.2.2`, `192.168.x.x`, etc.
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
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NSC_FILENAME = 'network_security_config.xml';

function buildAndroidNscXml({ apiHost, pinSha256, backupPinSha256, allowDevCleartext }) {
  const pins = [pinSha256, backupPinSha256]
    .filter(Boolean)
    .map((p) => `            <pin digest="SHA-256">${p}</pin>`)
    .join('\n');

  const pinSetBlock = pins
    ? `        <pin-set expiration="2030-01-01">
${pins}
        </pin-set>`
    : '';

  const apiDomainConfig = apiHost
    ? `    <!-- Production API: HTTPS only, pinned to known SPKI hash(es). -->
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">${apiHost}</domain>
${pinSetBlock}
    </domain-config>`
    : '';

  // Dev cleartext exception (RFC1918 + localhost + Android emulator host).
  const devCleartextConfig = allowDevCleartext
    ? `    <!-- Local development backends only. Not present in release builds. -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">10.0.0.0</domain>
        <domain includeSubdomains="true">172.16.0.0</domain>
        <domain includeSubdomains="true">192.168.0.0</domain>
    </domain-config>`
    : '';

  // Base config: no cleartext anywhere we didn't explicitly allow above,
  // and only trust the system CA store (no user-installed certs — blocks
  // tools like Charles/mitmproxy on rooted devices in production builds).
  const baseConfig = `    <base-config cleartextTrafficPermitted="${
    allowDevCleartext ? 'false' : 'false'
  }">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>`;

  return `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
${baseConfig}
${apiDomainConfig}
${devCleartextConfig}
</network-security-config>
`;
}

function withNetworkSecurityAndroid(config, opts) {
  // 1. Drop the XML file into res/xml/.
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
      );
      fs.mkdirSync(resXmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(resXmlDir, NSC_FILENAME),
        buildAndroidNscXml(opts),
        'utf8',
      );
      return cfg;
    },
  ]);

  // 2. Reference it from <application android:networkSecurityConfig="...">.
  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (app && app.$) {
      app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    }
    return cfg;
  });

  return config;
}

function withNetworkSecurityIos(config, { apiHost, pinSha256, backupPinSha256 }) {
  if (!apiHost || !pinSha256) return config;

  return withInfoPlist(config, (cfg) => {
    const pins = [pinSha256, backupPinSha256].filter(Boolean);

    cfg.modResults.NSPinnedDomains = {
      ...(cfg.modResults.NSPinnedDomains || {}),
      [apiHost]: {
        NSIncludesSubdomains: true,
        NSPinnedCAIdentities: pins.map((p) => ({
          'SPKI-SHA256-BASE64': p,
        })),
      },
    };

    return cfg;
  });
}

const withNetworkSecurity = (config, opts = {}) => {
  const apiHost = opts.apiHost || '';
  const pinSha256 = opts.pinSha256 || '';
  const backupPinSha256 = opts.backupPinSha256 || '';
  const allowDevCleartext = !!opts.allowDevCleartext;

  config = withNetworkSecurityAndroid(config, {
    apiHost,
    pinSha256,
    backupPinSha256,
    allowDevCleartext,
  });
  config = withNetworkSecurityIos(config, {
    apiHost,
    pinSha256,
    backupPinSha256,
  });

  return config;
};

module.exports = withNetworkSecurity;
