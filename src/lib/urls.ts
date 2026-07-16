/**
 * URL classification shared by the whole pipeline. Lives in its own module
 * because BOTH `build.ts` and `product.ts` need it and they must not import
 * each other (product.ts already imports build.ts).
 */

/** An absolute http(s) link with no whitespace. */
const URL_RE = /^https?:\/\/\S+$/i

/** A path (or query value) that names an actual image file. */
const IMAGE_EXT_RE =
  /\.(jpe?g|jfif|pjpeg|pjp|png|apng|webp|gif|avif|svg|bmp|ico|heic|heif)(\?|#|$)/i

/** CDNs that serve images from extension-less paths (…/image/upload/abc123). */
const IMAGE_HOST_RE =
  /(^|\.)(cdn\.salla\.sa|cdn\.shopify\.com|res\.cloudinary\.com|images\.unsplash\.com|imagedelivery\.net|i\.imgur\.com|ibb\.co|images-na\.ssl-images-amazon\.com|m\.media-amazon\.com)$/i

/** `?format=webp` / `?fm=jpg` / `?output=png` — an image behind a resizer. */
const IMAGE_QUERY_RE = /[?&](format|fm|output|ext)=(jpe?g|png|webp|gif|avif)\b/i

/** How an image cell's value reads to us. */
export type UrlKind =
  /** A data: URI or a link that clearly points at an image file. */
  | 'image'
  /** A valid link, but nothing says it is an image (often a product page). */
  | 'link'
  /** Not a link at all — scraped text, a filename, `-`, … */
  | 'notUrl'

export function classifyUrl(value: string): UrlKind {
  const v = String(value ?? '').trim()
  if (!v) return 'notUrl'
  if (/^data:image\//i.test(v)) return 'image'
  if (!URL_RE.test(v)) return 'notUrl'
  if (IMAGE_EXT_RE.test(v)) return 'image'
  if (IMAGE_QUERY_RE.test(v)) return 'image'
  try {
    if (IMAGE_HOST_RE.test(new URL(v).hostname)) return 'image'
  } catch {
    /* not parseable → fall through to 'link' */
  }
  return 'link'
}

/** True when a string is an image-file URL (used to keep image links visible). */
export function isImageUrl(url: string): boolean {
  return classifyUrl(url) === 'image'
}

/** True when a string is an absolute http(s) link, image or not. */
export function isUrl(url: string): boolean {
  return URL_RE.test(String(url ?? '').trim())
}
