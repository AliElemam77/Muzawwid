const STORAGE_KEY = 'sheet-to-salla:categories'

/** Separates multiple categories (paths) in one cell:  comma / Arabic comma. */
const CATEGORY_PATH_SEP = /[,،]+/
/**
 * Separates hierarchy levels within a path. Besides `>` and the guillemets
 * `›` / `»`, the MIRRORED forms `<` / `‹` are accepted: in an RTL editor the
 * arrow is rendered flipped, so users routinely type the one that *looks*
 * right. Nothing else uses these characters in a category name.
 */
const CATEGORY_LEVEL_SEP = /\s*[>›»<‹]\s*/
/**
 * Characters that carry no meaning but break equality/'trim': the Arabic
 * tatweel (kashida) and the zero-width / bidi marks that RTL editors and
 * copy-paste from web pages leave behind.
 */
const INVISIBLE_CHARS = /[\u0640\u200B-\u200F\uFEFF]/g

/** One category as its hierarchy levels, outermost first. */
export type CategoryPath = string[]

/** Trim, drop invisibles, collapse runs of whitespace to a single space. */
function cleanLevel(raw: string): string {
  return raw.replace(INVISIBLE_CHARS, '').replace(/\s+/g, ' ').trim()
}

/**
 * Parse a product's category cell into its categories, each one a list of
 * hierarchy levels. A comma (`,` or `،`) separates independent categories; an
 * arrow (`>`, `›`, `»`, `<`, `‹`) separates levels inside one category. Depth
 * is unbounded — Salla's own template ships a 3-level example.
 *
 *   `ملابس > نسائية > بناتي`   → [['ملابس','نسائية','بناتي']]
 *   `نسائي > عبايات , اعياد`   → [['نسائي','عبايات'], ['اعياد']]
 *
 * Empty levels and empty paths are dropped (`ملابس >  > رجالي` is two levels),
 * duplicate paths are removed (first-seen order kept), and an empty cell simply
 * yields no categories — that is not an error here.
 */
export function parseCategoryCell(raw: string): CategoryPath[] {
  if (!raw) return []
  const paths: CategoryPath[] = []
  const seen = new Set<string>()
  for (const rawPath of raw.split(CATEGORY_PATH_SEP)) {
    const levels = rawPath.split(CATEGORY_LEVEL_SEP).map(cleanLevel).filter(Boolean)
    if (levels.length === 0) continue
    const key = levels.join(' > ').toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    paths.push(levels)
  }
  return paths
}

/**
 * Render parsed categories back to the platform-standard cell shape used by
 * both Salla and Zid: levels joined by ` > `, categories joined by `, `.
 */
export function formatCategoryCell(paths: CategoryPath[]): string {
  return paths
    .map((levels) => levels.map(cleanLevel).filter(Boolean).join(' > '))
    .filter(Boolean)
    .join(', ')
}

/**
 * Drop any category that a MORE SPECIFIC selected one already contains:
 * picking `الكترونيات > موبيل` places the product under موبيل, which already
 * sits inside الكترونيات — listing the parent again on the same product says
 * nothing extra, so it goes.
 *
 *   [['الكترونيات'], ['الكترونيات','موبيل']]  → [['الكترونيات','موبيل']]
 *
 * Siblings are untouched (`الكترونيات > موبيل` + `الكترونيات > لابتوب` both
 * stay), and so is a category that merely shares a name prefix (`ملابس` is not
 * an ancestor of `ملابسي`).
 */
export function dropCoveredAncestors(paths: CategoryPath[]): CategoryPath[] {
  const keys = paths.map((levels) => levels.join(' > ').toLowerCase())
  return paths.filter(
    (_, i) => !keys.some((other, j) => j !== i && other.startsWith(`${keys[i]} > `)),
  )
}

/**
 * Normalize a product's category cell: `parse`, drop parents already covered by
 * a chosen sub-category, then `format`, e.g.
 *
 *   `ملابس>نسائية>بناتي`            → `ملابس > نسائية > بناتي`
 *   `حقائب › حقائب ظهر,  عروض`      → `حقائب > حقائب ظهر, عروض`
 *   `الكترونيات, الكترونيات > موبيل` → `الكترونيات > موبيل`
 */
export function normalizeCategoryField(raw: string): string {
  return formatCategoryCell(dropCoveredAncestors(parseCategoryCell(raw)))
}

/**
 * Clean a stored category list: every entry becomes one normalized path
 * (`ملابس>رجالي` → `ملابس > رجالي`), empties are dropped and duplicates removed,
 * first-seen order kept. An entry that carries several categories is split.
 */
export function normalizeCategories(list: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of list) {
    for (const levels of parseCategoryCell(raw)) {
      const path = levels.join(' > ')
      const key = path.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(path)
    }
  }
  return out
}

/* ------------------------------ category tree ---------------------------- */

/**
 * The store category list is stored FLAT — one full path per entry
 * (`'ملابس'`, `'ملابس > رجالي'`) — so presets, localStorage and the export path
 * all stay plain strings. The tree below is a view over that list, built for
 * the UI so a user picks/nests categories without ever typing a `>`.
 */
export interface CategoryNode {
  /** Full path — the value actually stored and exported. */
  path: string
  /** Just this level's name, e.g. `رجالي` — what the UI shows. */
  label: string
  /** 0 for a top-level category. */
  depth: number
  children: CategoryNode[]
}

/** The parent path of a category, or '' when it is top-level. */
export function parentPathOf(path: string): string {
  const levels = path.split(' > ')
  return levels.length > 1 ? levels.slice(0, -1).join(' > ') : ''
}

/**
 * Build the nesting tree from a flat list. Missing ancestors are synthesized,
 * so a list holding only `ملابس > رجالي` still renders under a `ملابس` group.
 */
export function buildCategoryTree(list: string[]): CategoryNode[] {
  const roots: CategoryNode[] = []
  const byPath = new Map<string, CategoryNode>()
  for (const entry of normalizeCategories(list)) {
    const levels = entry.split(' > ')
    let siblings = roots
    let path = ''
    for (let i = 0; i < levels.length; i++) {
      path = i === 0 ? levels[i] : `${path} > ${levels[i]}`
      const key = path.toLowerCase()
      let node = byPath.get(key)
      if (!node) {
        node = { path, label: levels[i], depth: i, children: [] }
        byPath.set(key, node)
        siblings.push(node)
      }
      siblings = node.children
    }
  }
  return roots
}

/** Depth-first walk of the tree — the reading order pickers should list in. */
export function flattenCategoryTree(nodes: CategoryNode[]): CategoryNode[] {
  const out: CategoryNode[] = []
  const walk = (list: CategoryNode[]) => {
    for (const n of list) {
      out.push(n)
      walk(n.children)
    }
  }
  walk(nodes)
  return out
}

/**
 * Add one or more categories under `parentPath` (empty = top level). The name
 * may itself be a comma-separated list, so a user can add several siblings at
 * once. Returns a new list re-ordered so children always follow their parent.
 */
export function addCategoryPath(
  list: string[],
  parentPath: string,
  name: string,
): string[] {
  const parent = normalizeCategoryField(parentPath)
  const next = [...list]
  // A synthesized ancestor becomes real as soon as something is nested in it.
  if (parent) next.push(parent)
  for (const child of splitCategoryInput(name)) {
    next.push(parent ? `${parent} > ${child}` : child)
  }
  return flattenCategoryTree(buildCategoryTree(next)).map((n) => n.path)
}

/** Remove a category AND everything nested inside it. */
export function removeCategoryPath(list: string[], path: string): string[] {
  const target = normalizeCategoryField(path).toLowerCase()
  if (!target) return list
  return normalizeCategories(list).filter((c) => {
    const p = c.toLowerCase()
    return p !== target && !p.startsWith(`${target} > `)
  })
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
