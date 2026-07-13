const STORAGE_KEY = 'sheet-to-salla:categories'

/** Separates multiple categories (paths) in one cell: comma / Arabic comma. */
const CATEGORY_PATH_SEP = /[,،]+/
/** Separates hierarchy levels within a path: `>` or the guillemets `›` / `»`. */
const CATEGORY_LEVEL_SEP = /\s*[>›»]\s*/

/**
 * Normalize a product's category cell to the platform-standard shape used by
 * both Salla and Zid: hierarchy levels joined by ` > ` and multiple categories
 * joined by `, `, e.g.
 *
 *   `ملابس>نسائية>بناتي`            → `ملابس > نسائية > بناتي`
 *   `حقائب › حقائب ظهر,  عروض`      → `حقائب > حقائب ظهر, عروض`
 *
 * Whitespace around separators is collapsed, empty levels/paths are dropped,
 * and duplicate paths are removed (first-seen order kept).
 */
export function normalizeCategoryField(raw: string): string {
  if (!raw) return ''
  const paths: string[] = []
  const seen = new Set<string>()
  for (const rawPath of raw.split(CATEGORY_PATH_SEP)) {
    const levels = rawPath
      .split(CATEGORY_LEVEL_SEP)
      .map((s) => s.trim())
      .filter(Boolean)
    if (levels.length === 0) continue
    const path = levels.join(' > ')
    const key = path.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    paths.push(path)
  }
  return paths.join(', ')
}

/** Trim, drop empties, and de-duplicate while preserving first-seen order. */
export function normalizeCategories(list: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of list) {
    const name = raw.trim()
    if (name && !seen.has(name)) {
      seen.add(name)
      out.push(name)
    }
  }
  return out
}

/** Split a pasted blob on newline / comma / Arabic comma / pipe into names. */
export function splitCategoryInput(text: string): string[] {
  return normalizeCategories(text.split(/[\n,،|]/))
}

/** Store-wide category list, persisted across files (safe: never throws). */
export function loadCategories(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? normalizeCategories(parsed.map(String)) : []
  } catch {
    return []
  }
}

export function saveCategories(list: string[]): string[] {
  const clean = normalizeCategories(list)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
  return clean
}
