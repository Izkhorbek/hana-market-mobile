import { IMAGE_BASE_URL } from '@/api/api';

/**
 * Converts a server-relative image path to a full URL.
 *
 * Examples:
 *   "/product_images/abc.jpg"  → "http://192.168.1.103:5000/product_images/abc.jpg"
 *   "http://..."               → unchanged (already absolute)
 *   null / undefined / ""      → ""
 */
export function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  // Already absolute — return as-is (handles http, https, and local file:// URIs)
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${IMAGE_BASE_URL}${cleanPath}`;
}
