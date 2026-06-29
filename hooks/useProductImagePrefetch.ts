import { resolveSizedImageUrl } from '@/utils/imageUrl'
import { Image } from 'expo-image'
import { useEffect } from 'react'

/**
 * Warms the disk cache for the first product card thumbnails so the first
 * visible images paint sooner after the products query resolves.
 *
 * Safe by design (Phase 1 — see docs/image-loading-performance-audit.md F4 and
 * docs/product-image-prefetch-report.md):
 * - Only requests the SAME sized thumbnail URL the card asks for
 *   (`?w=260&h=260&q=65`), so it warms the exact disk-cache entry the card
 *   reads — never a full-size original.
 * - Capped to the first N images (first viewport only), never whole pages.
 * - Skips empty/broken paths, dedupes, and never prefetches the same URL twice
 *   in one app session.
 * - Fire-and-forget: never awaited, never blocks render, errors swallowed.
 */

// Must match ProductCard's RemoteImage request params exactly, otherwise the
// prefetched URL would be a different cache key than the one the card loads.
const CARD_IMAGE_SIZE = { width: 260, height: 260, quality: 65 } as const
const DEFAULT_PREFETCH_LIMIT = 8

// Session-scoped dedupe: a URL prefetched once is never re-requested this run.
const prefetchedUrls = new Set<string>()

export function useProductImagePrefetch(
  imagePaths: (string | null | undefined)[],
  limit: number = DEFAULT_PREFETCH_LIMIT,
) {
  // Stable primitive dependency: the first-N paths joined. Keeps the effect from
  // re-running when the products array gets a new identity but the same leading
  // items (e.g. unrelated re-renders), while still reacting to real changes.
  const firstPathsKey = imagePaths.slice(0, limit).filter(Boolean).join('|')

  useEffect(() => {
    const urls = imagePaths
      .slice(0, limit)
      .map((path) => resolveSizedImageUrl(path, CARD_IMAGE_SIZE))
      .filter((url) => !!url && !prefetchedUrls.has(url))

    const uniqueUrls = Array.from(new Set(urls))
    if (uniqueUrls.length === 0) return

    // Mark before firing so concurrent renders don't re-queue the same URLs.
    uniqueUrls.forEach((url) => prefetchedUrls.add(url))

    // Best-effort cache warming. Match the card's `disk` cache policy. Failures
    // (offline, 404) are non-fatal — the card will just load normally on view.
    Image.prefetch(uniqueUrls, 'disk').catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstPathsKey, limit])
}

export default useProductImagePrefetch
