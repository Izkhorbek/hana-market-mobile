const HAS_TIMEZONE_SUFFIX = /(Z|[+-]\d{2}:\d{2})$/i

/**
 * Parse backend datetime safely.
 * If timezone is missing (e.g. 2026-02-27T21:26:41), treat it as UTC.
 */
export const parseBackendDateTime = (
  value: string | Date | null | undefined
): Date => {
  if (value instanceof Date) return value
  if (!value) return new Date(Number.NaN)

  const normalized = value.trim().replace(' ', 'T')
  const withZone = HAS_TIMEZONE_SUFFIX.test(normalized)
    ? normalized
    : `${normalized}Z`

  const parsed = new Date(withZone)

  // Fallback for non-ISO values from backend.
  if (Number.isNaN(parsed.getTime())) {
    return new Date(normalized)
  }

  return parsed
}
