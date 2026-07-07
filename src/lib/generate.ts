/**
 * Deterministic, offline content generation — no AI, no network. Produces SEO
 * fields (title / meta description / keywords) from the product name.
 *
 * NOTE: URL slugs are intentionally NOT generated here.
 */

const SEO_TITLE_MAX = 60
const META_DESC_MAX = 155

/** Collapse whitespace and trim. */
function tidy(s: string): string {
  return (s ?? '').replace(/\s+/g, ' ').trim()
}

/** The most specific category level (paths joined by '>'). */
function leafCategory(category: string): string {
  return tidy(category).split('>').pop()?.trim() ?? ''
}

/** SEO title: the product name, trimmed to ~60 chars on a word boundary. */
export function seoTitle(name: string, max = SEO_TITLE_MAX): string {
  const s = tidy(name)
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut).trim()
}

/**
 * Meta description: a short natural sentence from name (+ category + brand),
 * capped at ~155 chars. Arabic marketing phrasing.
 */
export function metaDescription(
  name: string,
  category = '',
  brand = '',
  max = META_DESC_MAX,
): string {
  const n = tidy(name)
  if (!n) return ''
  const parts = [`اشترِ ${n}`]
  const cat = leafCategory(category)
  if (cat) parts.push(`من قسم ${cat}`)
  const b = tidy(brand)
  if (b) parts.push(`ماركة ${b}`)
  let s = tidy(parts.join(' ')) + ' — بأفضل سعر وجودة عالية.'
  if (s.length > max) s = s.slice(0, max - 1).trim() + '…'
  return s
}

/**
 * Keywords: tokens from name + brand + category, deduped (case-insensitive),
 * comma-joined. Short/noise tokens are dropped; capped so it stays useful.
 */
export function keywords(name: string, brand = '', category = '', limit = 15): string {
  const raw = [tidy(name), tidy(brand), leafCategory(category)].filter(Boolean).join(' ')
  const seen = new Set<string>()
  const out: string[] = []
  for (const token of raw.split(/[\s,،|/\\_-]+/)) {
    const t = token.trim()
    if (t.length < 2) continue
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
    if (out.length >= limit) break
  }
  return out.join(', ')
}
