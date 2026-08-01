// ==================== EMERGENCY (SHOSHILINCH XIZMATLAR) TYPES ====================
// Public short numbers shown under the Mahalla tab. Admin-managed: the backend
// serves the categorized list (GET /api/emergency-numbers) and the admin
// dashboard adds/removes sections and numbers. The frontend keeps a small seed
// (constants/emergencyNumbers.ts) as a pre-backend fallback only.

/** One dialable number within a section. */
export interface EmergencyNumberDto {
  /** Admin-record id (frontend ignores it; present for admin CRUD). */
  id?: number
  /** Dialable short number, digits only (e.g. "101"). */
  number: string
  /** Service name (display). */
  name: string
}

/** A titled group of numbers (e.g. "Shoshilinch xizmatlar"). */
export interface EmergencySectionDto {
  id?: number
  /** Display title (admin-entered; shown verbatim, NOT i18n-mapped). */
  title: string
  /** Leading emoji, e.g. "🚨". */
  emoji: string
  /** Sort order (ascending); optional. */
  order?: number
  items: EmergencyNumberDto[]
}
