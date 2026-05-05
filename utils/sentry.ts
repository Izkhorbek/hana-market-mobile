/**
 * Sentry initialization & helpers.
 *
 * Goals:
 *   • Capture native (iOS/Android) and JS crashes that the in-app logger
 *     cannot see (e.g. native module crashes, hard JS engine faults).
 *   • Attach the same metadata our backend logger uses (release, env).
 *   • Strip PII before any event leaves the device.
 *   • Stay completely silent when no DSN is configured (e.g. in dev or
 *     forks). One module-level flag controls everything.
 *
 * Why a thin wrapper around @sentry/react-native?
 *   • Keep `Sentry.init` arguments in one place so the app start file is small.
 *   • Make the rest of the codebase import from `@/utils/sentry`, so we can
 *     swap providers (e.g. Bugsnag) later without touching call sites.
 *   • Centralize the PII-scrubbing rules so we don't accidentally leak data
 *     from a future call site.
 */

import { init as Sentry_init, setUser as Sentry_setUser, addBreadcrumb as Sentry_addBreadcrumb, wrap } from '@sentry/react-native';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};
const dsn: string = (extra.sentryDsn as string) || '';
const enableInDev: boolean = !!extra.sentryEnableInDev;
const appEnv: string = (extra.appEnv as string) || 'development';

const shouldEnable = !!dsn && (!__DEV__ || enableInDev);

let initialized = false;

// ── PII scrubbers ───────────────────────────────────────────────────────────
// The backend logger already redacts most things, but Sentry sees raw
// breadcrumbs (fetch URLs, console output, navigation events) so we run a
// second pass here. Keep this list in sync with backend privacy policy.

const TOKEN_HEADERS = new Set([
  'authorization',
  'x-access-token',
  'x-refresh-token',
  'cookie',
  'set-cookie',
]);

const scrubHeaders = (headers: Record<string, any> | undefined) => {
  if (!headers) return headers;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k] = TOKEN_HEADERS.has(k.toLowerCase()) ? '[REDACTED]' : v;
  }
  return out;
};

// Redact +998901234567 / 901234567 patterns (UZ phone numbers) from free text.
const PHONE_RE = /(\+?998)?\s?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g;
// Redact obvious bearer tokens.
const BEARER_RE = /Bearer\s+[A-Za-z0-9._\-]+/g;

const scrubString = (value: string): string => {
  return value.replace(PHONE_RE, '[PHONE]').replace(BEARER_RE, 'Bearer [REDACTED]');
};

const scrubDeep = (input: any, depth = 0): any => {
  if (input == null || depth > 4) return input;
  if (typeof input === 'string') return scrubString(input);
  if (Array.isArray(input)) return input.map((v) => scrubDeep(v, depth + 1));
  if (typeof input === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(input)) {
      out[k] = scrubDeep(v, depth + 1);
    }
    return out;
  }
  return input;
};

// ── Init ────────────────────────────────────────────────────────────────────

export const initSentry = () => {
  if (initialized || !shouldEnable) return;
  initialized = true;

  Sentry_init({
    dsn,
    environment: appEnv,
    release: Constants.expoConfig?.version ?? 'unknown',
    // Native crashes only — we already have JS error reporting via our logger
    // facade. Set tracesSampleRate=0 to avoid surprise costs; opt in later.
    tracesSampleRate: 0,
    // Hermes can include the JS stack in native crashes. Keep enabled.
    enableAutoSessionTracking: true,

    // Drop noisy / privacy-sensitive breadcrumbs entirely.
    beforeBreadcrumb(crumb) {
      // Skip our own telemetry POSTs to avoid recursive noise.
      const url: string | undefined = crumb.data?.url;
      if (url && url.includes('telemetry/log')) return null;

      if (crumb.data) {
        crumb.data = scrubDeep(crumb.data);
      }
      return crumb;
    },

    // Final scrub of the outgoing event.
    beforeSend(event) {
      try {
        if (event.request?.headers) {
          event.request.headers = scrubHeaders(event.request.headers as any);
        }
        if (event.request?.url) {
          event.request.url = scrubString(event.request.url);
        }
        if (event.message) {
          event.message = scrubString(event.message as string);
        }
        if (event.extra) {
          event.extra = scrubDeep(event.extra);
        }
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map((b) => ({
            ...b,
            message: b.message ? scrubString(b.message) : b.message,
            data: b.data ? scrubDeep(b.data) : b.data,
          }));
        }
      } catch {
        // If scrubbing throws, drop the event — better to lose telemetry than
        // ship raw PII.
        return null;
      }
      return event;
    },
  });
};

// ── User context ────────────────────────────────────────────────────────────

export const setSentryUser = (user: { id: number; username?: string | null } | null) => {
  if (!initialized) return;
  if (!user) {
    Sentry_setUser(null);
    return;
  }
  // Never send phone or email — only opaque id + username.
  Sentry_setUser({ id: String(user.id), username: user.username ?? undefined });
};

// ── Breadcrumbs (called by the logger facade) ───────────────────────────────

export const addSentryBreadcrumb = (
  level: 'info' | 'warning' | 'error' | 'fatal',
  message: string,
  data?: Record<string, any>,
) => {
  if (!initialized) return;
  Sentry_addBreadcrumb({
    level,
    message,
    data: data ? scrubDeep(data) : undefined,
  });
};

// ── Re-export for advanced call sites (rare) ────────────────────────────────
export { wrap as sentryWrap };

export const isSentryEnabled = () => initialized;
