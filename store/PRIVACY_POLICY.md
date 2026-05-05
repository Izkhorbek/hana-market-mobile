# Privacy Policy — Hana Market

**Effective date:** _<insert date before publishing>_
**Contact:** _<insert support email, e.g. support@hanamarket.uz>_

> ⚠️ This is a starter template based on the data flows actually present in
> the Hana Market codebase as of the date this file was generated. Have it
> reviewed by counsel licensed in the jurisdictions you publish in
> (Uzbekistan + EU/EEA via App Store/Play Store) before going live.

## 1. Who we are

Hana Market ("we", "our", "the App") is a peer-to-peer neighborhood
marketplace operated by _<legal entity name>_, registered at _<address>_.

## 2. Data we collect

### 2.1 You provide directly
| Data | Purpose | Required? |
|---|---|---|
| Phone number | Account creation, OTP login | Yes |
| Display name | Identifying you to other users | Yes |
| Profile photo | Optional avatar | No |
| Product photos & descriptions | Listings you publish | When posting |
| Chat messages | Communicating with other users | When chatting |
| Complaints / reports | Trust & safety enforcement | When filing |

### 2.2 Collected automatically
| Data | Purpose | Legal basis (GDPR) |
|---|---|---|
| Device model, OS version, app version | Debugging, crash analysis | Legitimate interest |
| Approximate location (city-level) | Showing nearby listings | Consent (location prompt) |
| Precise location | Setting product pickup point | Consent (location prompt) |
| Crash reports & error stack traces (via Sentry) | Stability monitoring | Legitimate interest |
| In-app navigation events (no PII) | Understanding usage patterns | Legitimate interest |

### 2.3 We do **not** collect
- Contacts list
- Calendar
- Health data
- Microphone audio
- Background location
- Advertising identifiers (no ad SDKs in the app)

## 3. How we use your data

- Provide and operate the marketplace (listings, chats, search).
- Authenticate you (OTP via SMS).
- Show you geographically relevant content.
- Detect fraud, abuse, and policy violations.
- Diagnose crashes and improve performance.

We **never** sell your personal data. We do not use your data for behavioral
advertising.

## 4. Data sharing

| Recipient | What we share | Why |
|---|---|---|
| Other Hana Market users | Public profile, listings, chat content | Core marketplace function |
| SMS provider (_<provider name>_) | Phone number, OTP code | Sending authentication SMS |
| Sentry (Functional Software, Inc.) | Crash logs, device metadata, optional user id | Stability monitoring |
| Google Maps Platform | Coarse location queries | Map tile rendering |
| Hosting provider (_<name>_) | All app data (encrypted at rest) | Backend storage |
| Law enforcement | Only on valid legal request | Legal compliance |

## 5. Data retention

- **Account data:** kept while your account is active.
- **Deleted accounts:** purged within 30 days of deletion request, except
  where retention is legally required (financial records, fraud
  investigations).
- **Chat messages:** retained for as long as both parties keep their accounts.
- **Crash reports:** auto-deleted after 90 days.

## 6. Your rights

You can, at any time, from in-app **Settings → Account**:
- Export your data
- Edit your profile
- Delete your account (irreversible)

EU/EEA users additionally have the right to:
- Access, rectify, or erase personal data (GDPR Articles 15–17)
- Restrict or object to processing (Articles 18, 21)
- Data portability (Article 20)
- Lodge a complaint with your supervisory authority

To exercise these rights, email _<support email>_ from the address associated
with your account.

## 7. Children

Hana Market is not directed to children under 13 (16 in some EU jurisdictions).
We do not knowingly collect data from children. If you believe a child has
provided us data, contact _<support email>_ and we will delete it.

## 8. Security

- All data is transmitted over TLS 1.2+.
- The mobile app pins the API server's TLS certificate (SHA-256 SPKI).
- Tokens are stored in the platform secure enclave (iOS Keychain /
  Android Keystore via `expo-secure-store`).
- Backend data at rest is encrypted with AES-256.

## 9. Changes to this policy

We will post material changes in-app at least 30 days before they take effect
and notify you via the email or phone number on your account.

## 10. Contact

Questions, requests, or complaints:
**Email:** _<support email>_
**Postal:** _<address>_
