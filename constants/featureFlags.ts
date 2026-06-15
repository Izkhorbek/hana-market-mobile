/**
 * Local feature flags for staged rollouts.
 *
 * Plain booleans (no env wiring yet) so they tree-shake and are trivially safe to
 * flip. If a runtime/remote kill-switch is later needed, source these from
 * `Constants.expoConfig?.extra` (set in app.config.ts) — matching the `appEnv` pattern.
 */
export const featureFlags = {
  /**
   * Phase 1: allow users to submit manner reviews after eligible chats.
   * This ONLY enables silent data collection (the review modal entry point).
   */
  mannerTemperatureCollectionEnabled: true,

  /**
   * Phase 2 (OFF): show manner temperature publicly — product cards, seller
   * profile, profile screen, chat header. Keep false until explicitly allowed.
   * While false, the summary/reviews/events read hooks never fetch.
   */
  mannerTemperaturePublicUiEnabled: false,
} as const

export type FeatureFlags = typeof featureFlags
