import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { logger } from '@/utils/logger'

/**
 * Client-side resize/compress for PRODUCT image uploads (draft-upload path only).
 *
 * See docs/mobile-image-upload-audit.md. Product image bytes are uploaded at
 * pick time via the draft endpoint, so this runs in ImageUploader before that
 * upload — never at product-create time.
 *
 * Behaviour:
 *  - Longest edge is capped at MAX_EDGE (downscale only — never upscales).
 *  - A single JPEG compression pass at JPEG_QUALITY is always applied. The
 *    picker is set to quality: 1 so this is the only compression (no double
 *    encode). When the source is already within MAX_EDGE we skip the resize
 *    transform and just compress.
 *  - Fails open: on any error the original uri is returned so the existing
 *    upload path continues unchanged.
 */

const MAX_EDGE = 1600
const JPEG_QUALITY = 0.82

export interface ResizeForUploadResult {
  /** Local uri to upload/preview — resized file on success, original on failure. */
  uri: string
  /** Result dimensions when known. */
  width?: number
  /** Result dimensions when known. */
  height?: number
}

export async function resizeImageForUpload(
  uri: string,
  sourceWidth?: number,
  sourceHeight?: number,
): Promise<ResizeForUploadResult> {
  try {
    const context = ImageManipulator.manipulate(uri)

    const hasDims =
      typeof sourceWidth === 'number' && sourceWidth > 0 &&
      typeof sourceHeight === 'number' && sourceHeight > 0

    // Only downscale when we know the image exceeds the cap. Never upscale, and
    // when dimensions are unknown skip the resize transform (compress-only) to
    // avoid accidental upscaling of an already-small image.
    if (hasDims && Math.max(sourceWidth!, sourceHeight!) > MAX_EDGE) {
      if (sourceWidth! >= sourceHeight!) {
        context.resize({ width: MAX_EDGE })
      } else {
        context.resize({ height: MAX_EDGE })
      }
    }

    const rendered = await context.renderAsync()
    const result = await rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG })

    return { uri: result.uri, width: result.width, height: result.height }
  } catch {
    // Path-free log (avoid leaking local file uris to telemetry in production).
    logger.warn('Image resize failed; uploading original image', {
      code: 'IMAGE_RESIZE_FAILED',
      screen: 'ImageUploader',
    })
    return { uri, width: sourceWidth, height: sourceHeight }
  }
}
