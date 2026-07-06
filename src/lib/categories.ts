const STORAGE_KEY = 'sheet-to-salla:categories'

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
