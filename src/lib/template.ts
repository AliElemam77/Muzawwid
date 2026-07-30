/**
 * Description templates — one HTML skeleton, filled per product from the sheet.
 *
 * The user writes the description ONCE with `{{variable}}` placeholders, and
 * every row gets its own filled copy. Placeholders resolve against two sources,
 * in this order:
 *
 *   1. mapped Salla fields  — `{{أسم المنتج}}`, `{{سعر المنتج}}` … these are the
 *      PROCESSED values (price cleaned, SKU generated, overrides applied), which
 *      is almost always what the user means.
 *   2. raw sheet columns    — `{{الخامة}}`, `{{بلد الصنع}}` … everything else in
 *      their file, including columns no Salla field maps to.
 *
 * A Salla field wins a name collision, since it is the more specific answer.
 *
 * Everything here is pure and DOM-free so it runs identically in the browser,
 * in a test, and during export.
 */

/**
 * Values a template renders against: field/column name → value. Values may be
 * absent — a source row and a Salla row both leave unset keys off entirely —
 * and a missing name resolves to '' like an empty one.
 */
export type TemplateContext = Record<string, string | undefined>

export interface TemplateConfig {
  /** Off by default — the template never touches the export until switched on. */
  enabled: boolean
  /** The HTML skeleton, placeholders included. */
  html: string
}

export const EMPTY_TEMPLATE: TemplateConfig = { enabled: false, html: '' }

/** `{{ anything but braces }}` — the placeholder form used everywhere. */
const TOKEN_RE = /\{\{\s*([^{}]+?)\s*\}\}/g

/** Block elements a placeholder line can live in — the unit we drop when empty. */
const BLOCK_RE = /<(p|li|h[1-6])(\s[^>]*)?>([\s\S]*?)<\/\1>/gi

/** An `<ul>`/`<ol>` left with no `<li>` after empty items were dropped. */
const EMPTY_LIST_RE = /<(ul|ol)(\s[^>]*)?>\s*<\/\1>/gi

/** HTML-escape a resolved value — sheet data is untrusted text, never markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Strip tags/entities to ask "did this block end up saying anything?". */
function textOf(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Every distinct placeholder name used in a template, in first-seen order. */
export function templateTokens(html: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const m of html.matchAll(TOKEN_RE)) {
    const name = m[1].trim()
    if (name && !seen.has(name)) {
      seen.add(name)
      out.push(name)
    }
  }
  return out
}

/** Resolve one placeholder; unknown names resolve empty, never to their own text. */
function lookup(ctx: TemplateContext, name: string): string {
  return (ctx[name] ?? '').trim()
}

/**
 * Substitute placeholders inside one block, or return null to DROP the block.
 *
 * A block is dropped when it carried at least one placeholder and every one of
 * them came back empty — that is the line «المقاس: {{المقاس}}» on a product
 * with no size, and leaving a dangling «المقاس:» behind reads as a bug. A block
 * whose placeholders partly resolve is kept: the author wrote the other words
 * on purpose.
 */
function fillBlock(inner: string, ctx: TemplateContext): string | null {
  let tokens = 0
  let filled = 0
  const out = inner.replace(TOKEN_RE, (_, rawName: string) => {
    tokens++
    const value = lookup(ctx, String(rawName).trim())
    if (value) filled++
    return escapeHtml(value)
  })
  if (tokens > 0 && filled === 0) return null
  return out
}

/**
 * Render a template for one product. Returns '' when the template is empty or
 * everything in it resolved away — the caller then leaves the field alone
 * rather than writing a blank description over a mapped one.
 */
export function renderTemplate(html: string, ctx: TemplateContext): string {
  if (!html.trim()) return ''

  // Blocks first, so a placeholder-only line can be removed whole…
  let out = html.replace(BLOCK_RE, (_whole, tag: string, attrs = '', inner: string) => {
    const filled = fillBlock(inner, ctx)
    return filled === null ? '' : `<${tag}${attrs ?? ''}>${filled}</${tag}>`
  })

  // …then anything left loose outside a block.
  out = out.replace(TOKEN_RE, (_, rawName: string) =>
    escapeHtml(lookup(ctx, String(rawName).trim())),
  )

  out = out.replace(EMPTY_LIST_RE, '').trim()
  return textOf(out) ? out : ''
}

/** One offerable placeholder, ready to list in the inserter. */
export interface TemplateVar {
  /** The name that goes inside `{{ }}`. */
  name: string
  /** Where it comes from — drives the grouping in the picker. */
  source: 'field' | 'column'
}

/**
 * The placeholders available for THIS sheet: mapped Salla fields first, then
 * the sheet's own columns. A column whose name a Salla field already claimed is
 * dropped — it could never win the lookup, so offering it would be a lie.
 */
export function templateVars(
  mappedFields: string[],
  sheetColumns: string[],
): TemplateVar[] {
  const seen = new Set<string>()
  const out: TemplateVar[] = []
  for (const name of mappedFields) {
    if (!name || seen.has(name)) continue
    seen.add(name)
    out.push({ name, source: 'field' })
  }
  for (const name of sheetColumns) {
    if (!name || seen.has(name)) continue
    seen.add(name)
    out.push({ name, source: 'column' })
  }
  return out
}

/** Wrap a variable name in the placeholder form the editor inserts. */
export function tokenFor(name: string): string {
  return `{{${name}}}`
}
