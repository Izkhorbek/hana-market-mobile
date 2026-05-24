import { IMAGE_BASE_URL } from '@/api/api'

/**
 * Converts a server-relative image path to a full URL.
 *
 * Examples:
 *   "/product_images/abc.jpg"  → "http://192.168.1.103:5000/product_images/abc.jpg"
 *   "http://..."               → unchanged (already absolute)
 *   null / undefined / ""      → ""
 */
export function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return ''
  // Already absolute — return as-is (handles http, https, and local file:// URIs)
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://')) return path
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${IMAGE_BASE_URL}${cleanPath}`
}

interface ImageSizeOptions {
  width: number;
  height?: number;
  quality?: number;
}

/**
 * Builds a URL that hints the backend/CDN to return a smaller image variant.
 * If the backend ignores these query params, the original image is still served.
 */
export function resolveSizedImageUrl(
  path: string | null | undefined,
  { width, height, quality = 70 }: ImageSizeOptions,
): string {
  const baseUrl = resolveImageUrl(path)
  if (!baseUrl) return ''
  if (baseUrl.startsWith('file://')) return baseUrl

  const joiner = baseUrl.includes('?') ? '&' : '?'
  const sizeParams = [`w=${Math.max(1, Math.round(width))}`]
  if (height && height > 0) {
    sizeParams.push(`h=${Math.round(height)}`)
  }
  sizeParams.push(`q=${Math.max(1, Math.min(100, Math.round(quality)))}`)
  return `${baseUrl}${joiner}${sizeParams.join('&')}`
}
