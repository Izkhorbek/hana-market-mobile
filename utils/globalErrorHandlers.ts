/**
 * Wires up global JS error / promise rejection handlers so anything that
 * escapes try/catch and React error boundaries still reaches the backend
 * telemetry endpoint.
 *
 * Call once from the app root (see `app/_layout.tsx`).
 */

import { logger } from '@/utils/logger'

let installed = false

export const installGlobalErrorHandlers = () => {
  if (installed) return
  installed = true

  // ── Uncaught JS errors (React Native + Hermes) ───────────────────────────
  const ErrorUtils: any = (globalThis as any).ErrorUtils
  if (ErrorUtils?.setGlobalHandler) {
    const previous = ErrorUtils.getGlobalHandler?.()
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      logger[isFatal ? 'fatal' : 'error'](
        isFatal ? 'JS_FATAL_ERROR' : 'JS_UNCAUGHT_ERROR',
        error,
      )
      // Preserve default red-box behavior in dev / crash reporting in prod.
      if (typeof previous === 'function') {
        previous(error, isFatal)
      }
    })
  }

  // ── Unhandled promise rejections ─────────────────────────────────────────
  // RN ships with `promise/setimmediate/rejection-tracking`. We hook into it
  // dynamically so this file works whether or not the polyfill is present.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tracking = require('promise/setimmediate/rejection-tracking')
    tracking.enable({
      allRejections: true,
      onUnhandled: (id: number, error: unknown) => {
        logger.error('UNHANDLED_PROMISE_REJECTION', error, { extra: { id } })
      },
      onHandled: () => {
        // No-op: we already reported. Keep noise out of telemetry.
      },
    })
  } catch {
    // Polyfill not available — nothing to do.
  }
}
