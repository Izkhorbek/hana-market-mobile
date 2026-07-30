import { AppLimits } from '@/constants/appLimits'

type Translate = (key: string) => string

/**
 * A buyer may only message the seller about an ACTIVE listing. Reserved, sold,
 * hidden and deleted listings are all non-chattable. Mirrors the backend guard
 * (which rejects sends for deleted/hidden/sold with code "product_unavailable").
 *
 * Returns true only for a KNOWN unavailable status, so an empty/unknown status
 * (e.g. before the product has loaded) never blocks chat by mistake.
 */
export function isChatBlockedStatus(status?: string | null): boolean {
  return (
    status === AppLimits.ProductStatus.reserved ||
    status === AppLimits.ProductStatus.sold ||
    status === AppLimits.ProductStatus.hidden ||
    status === AppLimits.ProductStatus.deleted
  )
}

/** Localized explanation for why messaging is unavailable, by product status. */
export function chatUnavailableMessage(
  status: string | null | undefined,
  t: Translate,
): string {
  switch (status) {
    case AppLimits.ProductStatus.reserved:
      return t('chat_unavailable.reserved')
    case AppLimits.ProductStatus.sold:
      return t('chat_unavailable.sold')
    case AppLimits.ProductStatus.hidden:
      return t('chat_unavailable.hidden')
    case AppLimits.ProductStatus.deleted:
      return t('chat_unavailable.deleted')
    default:
      return t('chat_unavailable.generic')
  }
}
