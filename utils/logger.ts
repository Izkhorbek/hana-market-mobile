/**
 * Application logger facade.
 *
 * Goals:
 *  - Single, app-wide entry point for sending diagnostic events to the backend
 *    (`POST /telemetry/log`).
 *  - Never throws. A logging failure must not break user flows.
 *  - Enriches every payload with device/app metadata.
 *  - Truncates oversized fields per backend contract.
 *  - In development, mirrors output to the JS console.
 *  - Dedupes a burst of identical errors within a short window.
 *  - Drops events when the user is offline (the backend can't receive them
 *    anyway, and we don't want to leak memory in long offline sessions).
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.error('PRODUCT_LOAD_FAILED', err, { screen: 'EditProduct', extra: { productId } });
 */

import { telemetryService } from '@/api/services';
import type { MobileLogDto } from '@/types';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { addSentryBreadcrumb } from './sentry';

// ── Backend field limits ────────────────────────────────────────────────────
const LIMITS = {
  CODE: 120,
  MESSAGE: 2000,
  STACK: 8000,
  TRACE_ID: 64,
  SCREEN: 120,
  APP_VERSION: 40,
  PLATFORM: 20,
  OS_VERSION: 60,
  DEVICE: 100,
  EXTRA_BYTES: 4 * 1024, // 4 KB serialized
} as const;

// ── Dedup window (ms) — same {level+code+message} not re-sent within this ──
const DEDUP_WINDOW_MS = 30_000;

// ── Module state ────────────────────────────────────────────────────────────
const recentSignatures = new Map<string, number>();

const truncate = (value: string | undefined, max: number): string | undefined => {
  if (value == null) return undefined;
  if (value.length <= max) return value;
  return value.slice(0, max);
};

const truncateExtra = (extra: Record<string, any> | undefined): Record<string, any> | undefined => {
  if (!extra) return undefined;
  try {
    const json = JSON.stringify(extra);
    if (json.length <= LIMITS.EXTRA_BYTES) return extra;
    // Too large — store a notice and a truncated string snapshot only.
    return {
      _truncated: true,
      _original_size: json.length,
      snapshot: json.slice(0, LIMITS.EXTRA_BYTES - 200),
    };
  } catch {
    return { _serialization_error: true };
  }
};

// ── Device / app metadata (resolved once) ───────────────────────────────────
const platformName = (() => {
  if (Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web') {
    return Platform.OS;
  }
  return String(Platform.OS);
})();

const osVersion = `${Platform.OS} ${Platform.Version}`;

const appVersion =
  Constants.expoConfig?.version ??
  // @ts-ignore older Expo versions
  Constants.manifest?.version ??
  'unknown';

const deviceName: string | undefined =
  Constants.deviceName ??
  // @ts-ignore Constants types vary across Expo SDK versions
  Constants.platform?.ios?.model ??
  undefined;

// ── Mutable runtime context (current screen / route) ────────────────────────
let currentScreen: string | undefined;

export const setLoggerScreen = (screen: string | undefined) => {
  currentScreen = screen;
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const normalizeError = (err: unknown): { message: string; stack?: string } => {
  if (err instanceof Error) {
    return { message: err.message || err.name || 'Error', stack: err.stack };
  }
  if (typeof err === 'string') return { message: err };
  if (err && typeof err === 'object') {
    try {
      const anyErr = err as any;
      const message =
        anyErr.message ||
        anyErr.response?.data?.message ||
        anyErr.response?.data?.errors?.[0] ||
        JSON.stringify(err);
      return { message: String(message), stack: anyErr.stack };
    } catch {
      return { message: 'Unknown error' };
    }
  }
  return { message: 'Unknown error' };
};

const shouldDedupe = (level: string, code: string | undefined, message: string): boolean => {
  const sig = `${level}|${code ?? ''}|${message}`;
  const now = Date.now();
  const last = recentSignatures.get(sig);
  if (last && now - last < DEDUP_WINDOW_MS) return true;
  recentSignatures.set(sig, now);
  // Trim old entries opportunistically.
  if (recentSignatures.size > 200) {
    for (const [k, t] of recentSignatures) {
      if (now - t > DEDUP_WINDOW_MS) recentSignatures.delete(k);
    }
  }
  return false;
};

interface LogOptions {
  code?: string;
  screen?: string;
  trace_id?: string;
  extra?: Record<string, any>;
}

const buildPayload = (
  level: 'info' | 'warn' | 'error' | 'fatal',
  message: string,
  stack: string | undefined,
  options: LogOptions | undefined,
): MobileLogDto => ({
  level,
  code: truncate(options?.code, LIMITS.CODE),
  message: truncate(message, LIMITS.MESSAGE) ?? '',
  stack: truncate(stack, LIMITS.STACK),
  trace_id: truncate(options?.trace_id, LIMITS.TRACE_ID),
  screen: truncate(options?.screen ?? currentScreen, LIMITS.SCREEN),
  app_version: truncate(appVersion, LIMITS.APP_VERSION),
  platform: truncate(platformName, LIMITS.PLATFORM),
  os_version: truncate(osVersion, LIMITS.OS_VERSION),
  device: truncate(deviceName, LIMITS.DEVICE),
  extra: truncateExtra(options?.extra),
});

const send = (payload: MobileLogDto) => {
  // Fire-and-forget. Never let a logging failure surface.
  telemetryService.log(payload).catch(() => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[logger] telemetry send failed (suppressed)');
    }
  });
};

const log = (
  level: 'info' | 'warn' | 'error' | 'fatal',
  messageOrError: unknown,
  options?: LogOptions,
) => {
  try {
    const { message, stack } =
      typeof messageOrError === 'string'
        ? { message: messageOrError, stack: undefined }
        : normalizeError(messageOrError);

    if (shouldDedupe(level, options?.code, message)) return;

    const payload = buildPayload(level, message, stack, options);

    if (__DEV__) {
      // eslint-disable-next-line no-console
      const out = level === 'error' || level === 'fatal' ? console.error : console.log;
      out(`[${level.toUpperCase()}]${payload.code ? ` ${payload.code}` : ''} ${payload.message}`, options?.extra ?? '');
    }

    // Drop a Sentry breadcrumb so when a *real* native crash later occurs,
    // the engineering team can see what business-level events preceded it.
    // We do NOT call Sentry.captureException here — Sentry already catches
    // uncaught errors via its own global handlers. Avoiding double-reporting.
    addSentryBreadcrumb(
      level === 'warn' ? 'warning' : level,
      payload.code ? `${payload.code}: ${payload.message}` : payload.message,
      { screen: payload.screen, ...options?.extra },
    );

    send(payload);
  } catch {
    // Swallow — logging must never throw.
  }
};

export const logger = {
  info: (message: string, options?: LogOptions) => log('info', message, options),
  warn: (messageOrError: unknown, options?: LogOptions) => log('warn', messageOrError, options),
  error: (codeOrError: string | unknown, errOrOptions?: unknown, maybeOptions?: LogOptions) => {
    // Two ergonomic shapes:
    //   logger.error('CODE', error, { screen, extra })
    //   logger.error(error, { code, screen, extra })
    if (typeof codeOrError === 'string') {
      const code = codeOrError;
      const opts = (maybeOptions ?? {}) as LogOptions;
      return log('error', errOrOptions ?? code, { ...opts, code });
    }
    return log('error', codeOrError, (errOrOptions as LogOptions) ?? undefined);
  },
  fatal: (codeOrError: string | unknown, errOrOptions?: unknown, maybeOptions?: LogOptions) => {
    if (typeof codeOrError === 'string') {
      const code = codeOrError;
      const opts = (maybeOptions ?? {}) as LogOptions;
      return log('fatal', errOrOptions ?? code, { ...opts, code });
    }
    return log('fatal', codeOrError, (errOrOptions as LogOptions) ?? undefined);
  },
  setScreen: setLoggerScreen,
};

export default logger;
