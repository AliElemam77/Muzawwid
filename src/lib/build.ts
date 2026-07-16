import {
  F,
  ROW_PRODUCT,
  ROW_OPTION,
  OPTION_TYPES,
  OPTION_VALUE_PLACEHOLDER,
  optionGroupCols,
  type SallaRow,
  type OptionType,
} from './salla'
import { normalizeCategoryField } from './categories'
import { applyPriceRules } from './pricing'
import { classifyUrl } from './urls'
import type { SourceSheet, SourceRow } from './reader'
import { DEFAULT_PROMO_TITLE, type MappingConfig, type OptionColumn } from './types'

/** Salla's العنوان الترويجي (promo title) hard limit — enforced in `validate`. */
const SALLA_PROMO_TITLE_MAX = 25

/**
 * When clamping a promo title, back off to the last word boundary only if that
 * still keeps at least this many characters — otherwise a hard cut reads better
 * than a two-word stub.
 */
const PROMO_WORD_BOUNDARY_MIN = 12

/* ----------------------------- value helpers ----------------------------- */

/** Strip currency symbols / thousands separators; '-' or '' → ''. */
export function cleanPrice(v: string): string {
  if (v == null) return ''
  let s = String(v).trim()
  if (s === '' || s === '-') return ''
  s = s
    .replace(/ر\.?\s?س\.?|ريال|sar|sr|﷼|\$|usd|aed|درهم/gi, '')
    .replace(/[,،]/g, '')
    .replace(/\s+/g, '')
    .trim()
  return s
}

/**
 * Salla rejects "اقصي كمية لكل عميل" values below 1 (e.g. a mapped stock column
 * that is 0). An empty cell means "no limit" and is accepted — so any value that
 * isn't a whole number >= 1 is blanked out.
 */
export function cleanMaxQty(v: string): string {
  const s = String(v ?? '').trim()
  if (s === '') return ''
  const n = Number(s.replace(/[,،\s]/g, ''))
  if (!Number.isFinite(n) || n < 1) return ''
  return String(Math.floor(n))
}

/** Split a multi-value cell on comma / Arabic comma / pipe / newline. */
export function splitValues(cell: string): string[] {
  if (!cell) return []
  return cell
    .split(/[,،|\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

const OPTION_URL_RE = /^https?:\/\//i

/**
 * Split a cell into clean option values: trim, empties out, dedupe (order kept).
 * For text/color options a URL is scrape garbage and is dropped — but an IMAGE
 * option's values ARE URLs, so those are kept. Shared by the Salla and Zid
 * variant expanders so garbage never becomes a خيار / sub-product row.
 */
export function cleanOptionValues(cell: string, type: OptionType = 'text'): string[] {
  const keepUrls = type === 'image'
  const out: string[] = []
  const seen = new Set<string>()
  for (const v of splitValues(cell)) {
    if (!keepUrls && OPTION_URL_RE.test(v)) continue
    if (seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  return out
}

/** Merge several image cells → dedup, non-empty, comma-joined. */
function mergeImages(row: SourceRow, columns: string[]): string {
  const urls: string[] = []
  const seen = new Set<string>()
  for (const col of columns) {
    for (const u of splitValues(row[col] ?? '')) {
      if (!seen.has(u)) {
        seen.add(u)
        urls.push(u)
      }
    }
  }
  return urls.join(',')
}

function isHex(v: string): boolean {
  return /^#?[0-9a-fA-F]{3,8}$/.test(v.trim())
}

/* ------------------------------ promo title ------------------------------ */

/**
 * Cut a promo title down to Salla's 25-character limit. The cut prefers the
 * last word boundary so the result never ends mid-word, unless that would throw
 * away most of the text — then a hard cut wins. Trailing punctuation is dropped.
 */
export function clampPromoTitle(value: string): string {
  const s = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (s.length <= SALLA_PROMO_TITLE_MAX) return s
  const cut = s.slice(0, SALLA_PROMO_TITLE_MAX)
  const lastSpace = cut.lastIndexOf(' ')
  const out = lastSpace >= PROMO_WORD_BOUNDARY_MIN ? cut.slice(0, lastSpace) : cut
  return out.replace(/[\s.,،؛:\-–—|/\\]+$/, '')
}

/** Descriptions are often HTML — flatten before using one as a promo title. */
function plainText(value: string): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Resolve العنوان الترويجي for one product row: use the mapped/edited value if
 * there is one, else derive it from the name or the description (the configured
 * field first, the other as a backstop), then clamp to Salla's 25 chars.
 */
function promoTitleFor(parent: SallaRow, config: MappingConfig): string {
  const cfg = config.promoTitle ?? DEFAULT_PROMO_TITLE
  let value = (parent[F.promoTitle] ?? '').trim()

  if (!value && cfg.fallback !== 'none') {
    const order =
      cfg.fallback === 'description'
        ? [parent[F.description], parent[F.name]]
        : [parent[F.name], parent[F.description]]
    value = order.map((v) => plainText(v ?? '')).find((v) => v.length > 0) ?? ''
  }

  return cfg.truncate ? clampPromoTitle(value) : value
}

/* ------------------------------- field read ------------------------------ */

/** Resolve a single Salla field's value from the config for one source row. */
function fieldValue(row: SourceRow, config: MappingConfig, field: string): string {
  const src = config.fields[field]
  if (!src || src.kind === 'none') return ''
  if (src.kind === 'constant') return src.value ?? ''
  return row[src.column] ?? ''
}

/** Apply the sanitizer appropriate to a given Salla field. */
function transformFieldValue(field: string, raw: string): string {
  if (field === F.price || field === F.cost || field === F.discountPrice) {
    return cleanPrice(raw)
  }
  if (field === F.maxQty) return cleanMaxQty(raw)
  if (field === F.category) return normalizeCategoryField(raw)
  // A hand-edited image cell arrives as pasted links — normalize it to the same
  // comma-joined, de-duplicated shape `mergeImages` produces.
  if (field === F.image) return dedupe(splitValues(raw)).join(',')
  return raw
}

/** Keep the first occurrence of each entry (order preserved). */
function dedupe(values: string[]): string[] {
  return [...new Set(values)]
}

/** Write a cell, or drop the key entirely when the value is empty. */
function setOrClear(row: SallaRow, field: string, value: string) {
  if (value) row[field] = value
  else delete row[field]
}

/* -------------------------------- SKU gen -------------------------------- */

function parentSku(row: SourceRow, config: MappingConfig, index: number): string {
  const sku = config.sku
  switch (sku.mode) {
    case 'column':
      return (row[sku.column] ?? '').trim()
    case 'regex': {
      const m = /\/p(\d+)/.exec(row[sku.column] ?? '')
      const id = m ? m[1] : ''
      return id ? `${sku.prefix}${id}` : ''
    }
    case 'auto':
      return `${sku.prefix}${index + 1}`
    default:
      // fall back to a mapped رمز المنتج field, if any
      return fieldValue(row, config, F.sku).trim()
  }
}

/* ------------------------------ core builder ----------------------------- */

/** Per-output-row link back to its source, so the UI can edit specific rows. */
export interface RowMeta {
  /** Index of the source row this output row came from. */
  sourceIndex: number
  /** True for a منتج (parent) row, false for a خيار (variant) row. */
  isProduct: boolean
  /**
   * منتج rows only, and only when the row declares options: the axes it
   * declared, in column order ([1], [2], [3]) — lets the UI rename an axis.
   */
  axes?: { axisIndex: number; name: string }[]
  /**
   * خيار rows only: the option picks this variant carries, in the same column
   * order — lets the UI rewrite or drop a specific value.
   */
  picks?: { axisIndex: number; original: string; value: string }[]
}

/**
 * Manual per-product field edits, keyed by source row index → Salla header →
 * value. Wins over the mapped column. An empty string clears that field.
 * Used for inline editing of أسم المنتج / سعر المنتج / تصنيف المنتج in the preview.
 */
export type RowOverrides = Record<number, Record<string, string>>

export interface BuildResult {
  rows: SallaRow[]
  /** Aligned 1:1 with `rows`. */
  meta: RowMeta[]
  productCount: number
  optionCount: number
}

/**
 * Apply editable defaults to a target cell only when it is empty. `نوع المنتج`
 * and `هل يتطلب شحن؟` are PRODUCT-row fields — Salla rejects them on خيار rows
 * ("... مطلوب في صف المنتج"), so they're filled only when `isProduct`. Weight,
 * unit, taxable and max-qty are required on every row.
 */
function applyDefaults(target: SallaRow, config: MappingConfig, isProduct: boolean) {
  const d = config.defaults
  if (isProduct) {
    if (!target[F.productType]) target[F.productType] = d.productType
    if (!target[F.requiresShipping]) target[F.requiresShipping] = d.requiresShipping
  }
  if (!target[F.taxable]) target[F.taxable] = d.taxable
  if (!target[F.weight]) target[F.weight] = d.weight
  if (!target[F.weightUnit]) target[F.weightUnit] = d.weightUnit
  // Salla requires "اقصي كمية لكل عميل" >= 1 on every row (empty is read as 0).
  if (!target[F.maxQty]) target[F.maxQty] = d.maxQtyPerCustomer
}

/** Normalize an option's display name for merge comparison. */
function normOptionName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

/**
 * Group option columns that share the same display name into one logical
 * axis. A scraped sheet often splits ONE attribute (e.g. size) across several
 * columns — one per available value, from a variant-selector grid — each
 * mapped as its own OptionColumn but given the SAME name ("المقاس"). Those
 * must combine into ONE group with the union of values (→ one خيار row per
 * value), never separate option groups each holding a single value (which
 * produced "المقاس: 52" and "المقاس: 54" as two different groups instead of
 * one "المقاس" group with two variants). Unnamed options stay separate — each
 * is its own already-flagged issue, not something to merge blindly.
 */
export function groupOptionColumnsByName(options: OptionColumn[]): OptionColumn[][] {
  const groups = new Map<string, OptionColumn[]>()
  const order: string[] = []
  options.forEach((opt, i) => {
    const key = normOptionName(opt.name) || `__unnamed:${i}`
    if (!groups.has(key)) {
      groups.set(key, [])
      order.push(key)
    }
    groups.get(key)!.push(opt)
  })
  return order.map((k) => groups.get(k)!)
}

/** One option value plus the source column it came from (for swatch lookup). */
interface AxisValue {
  /** The value as the sheet gave it — the stable key for a manual edit. */
  original: string
  /** What actually gets exported (the manual edit, if any). */
  value: string
  swatchColumn?: string
}

/** A per-row option axis: its representative column (name/type) + merged values. */
interface RowAxis {
  /** Position among the row's populated axes — the stable key for manual edits. */
  index: number
  opt: OptionColumn
  values: AxisValue[]
}

/**
 * Manual, per-product edits to the options the mapping produced — so a user can
 * fix a bad axis name or value (or drop one) without touching the source sheet.
 * Keyed by source row index; axis keys come from `RowAxis.index`.
 */
export interface OptionEdits {
  /** axis index → replacement display name. */
  names?: Record<number, string>
  /** `${axisIndex}:${originalValue}` → replacement value. */
  values?: Record<string, string>
  /** `${axisIndex}:${originalValue}` keys removed from the export. */
  removed?: string[]
}

export type OptionOverrides = Record<number, OptionEdits>

/** The key an `OptionEdits.values` / `.removed` entry is stored under. */
export function optionValueKey(axisIndex: number, originalValue: string): string {
  return `${axisIndex}:${originalValue}`
}

/**
 * Resolve each option's display name for THIS row. An option whose `nameColumn`
 * is set reads its name from that cell (sheets where the axis label varies per
 * product); the configured `name` stays the fallback for empty cells. Names are
 * resolved before grouping, so two columns that resolve to the same name on a
 * given row still merge into one axis.
 */
export function resolveOptionNames(row: SourceRow, options: OptionColumn[]): OptionColumn[] {
  return options.map((o) =>
    o.nameColumn ? { ...o, name: (row[o.nameColumn] ?? '').trim() || o.name } : o,
  )
}

/**
 * Options that actually have (cleaned) values for this row — capped at 3.
 * Columns sharing a display name are merged into one axis first (see
 * `groupOptionColumnsByName`). A product whose option columns are all empty
 * yields none → simple product. Manual edits are applied last, keyed by the
 * axis index assigned BEFORE them, so a key stays stable even when an edit
 * empties an axis and drops it.
 */
function rowAxes(row: SourceRow, options: OptionColumn[], edits?: OptionEdits): RowAxis[] {
  const removed = new Set(edits?.removed ?? [])

  return groupOptionColumnsByName(resolveOptionNames(row, options))
    .map((group) => {
      const seen = new Set<string>()
      const values: AxisValue[] = []
      for (const opt of group) {
        for (const v of cleanOptionValues(row[opt.column] ?? '', opt.type)) {
          if (seen.has(v)) continue
          seen.add(v)
          values.push({ original: v, value: v, swatchColumn: opt.swatchColumn })
        }
      }
      return { opt: group[0], values }
    })
    .filter((a) => a.values.length > 0)
    .slice(0, 3)
    .map((axis, index) => ({
      index,
      // `??`, not `||`: an edit of '' means the user CLEARED the field and must
      // see it stay cleared (`validate` then flags it) — snapping back to the
      // sheet's value would fight them mid-edit.
      opt: { ...axis.opt, name: edits?.names?.[index] ?? axis.opt.name },
      values: axis.values
        .filter((v) => !removed.has(optionValueKey(index, v.original)))
        .map((v) => ({
          ...v,
          value: edits?.values?.[optionValueKey(index, v.original)] ?? v.value,
        })),
    }))
    .filter((a) => a.values.length > 0)
}

/** One resolved option pick inside a variant combination. */
interface ComboItem {
  opt: OptionColumn
  /** Stable axis key (see `RowAxis.index`), carried so the UI can edit it. */
  axisIndex: number
  /** The sheet's value — the edit key, kept even when `value` was rewritten. */
  original: string
  value: string
  swatch: string
}

/** Cartesian product across the row's populated axes (+ hex swatch for colors). */
function optionCombos(row: SourceRow, axes: RowAxis[]): ComboItem[][] {
  const expanded = axes.map(({ opt, index, values }) =>
    values.map(({ value, original, swatchColumn }) => {
      let swatch = ''
      if (opt.type === 'color') {
        const fromCol = swatchColumn ? (row[swatchColumn] ?? '') : ''
        if (fromCol && isHex(fromCol)) swatch = fromCol.startsWith('#') ? fromCol : `#${fromCol}`
        else if (isHex(value)) swatch = value.startsWith('#') ? value : `#${value}`
      } else if (opt.type === 'image' && OPTION_URL_RE.test(value)) {
        // Image option: the value is an image URL → also place it in the
        // [n] الصورة / اللون column so Salla renders it as an image swatch.
        swatch = value
      }
      return { opt, axisIndex: index, original, value, swatch }
    }),
  )

  return expanded.reduce<ComboItem[][]>((acc, axis) => {
    const next: ComboItem[][] = []
    for (const combo of acc) for (const item of axis) next.push([...combo, item])
    return next
  }, [[]])
}

export function buildRows(
  source: SourceSheet,
  config: MappingConfig,
  rowOverrides: RowOverrides = {},
  excludedRows: ReadonlySet<number> = new Set(),
  optionOverrides: OptionOverrides = {},
): BuildResult {
  const out: SallaRow[] = []
  const meta: RowMeta[] = []
  let productCount = 0
  let optionCount = 0

  const fieldsToCopy = Object.keys(config.fields).filter(
    (f) => f !== F.image && f !== F.sku,
  )

  source.rows.forEach((row, index) => {
    // Skip completely empty source rows.
    if (Object.values(row).every((v) => !v)) return
    // Skip items the user removed — drops the product AND all its variants.
    if (excludedRows.has(index)) return

    const parent: SallaRow = { [F.type]: ROW_PRODUCT }

    // Simple mapped fields, each run through its field-specific sanitizer.
    for (const field of fieldsToCopy) {
      const v = transformFieldValue(field, fieldValue(row, config, field))
      if (v) parent[field] = v
    }

    // Images (merge takes precedence over a single mapped image column).
    const images = config.imageColumns.length
      ? mergeImages(row, config.imageColumns)
      : fieldValue(row, config, F.image)
    if (images) parent[F.image] = images

    // SKU.
    const mappedSku = parentSku(row, config, index)
    if (mappedSku) parent[F.sku] = mappedSku

    // Manual per-product edits (name / price / category / images …) win over
    // EVERYTHING the mapping produced, so they run last. Still ahead of variant
    // expansion, so an edited price/SKU flows down to the variants.
    const overrides = rowOverrides[index]
    if (overrides) {
      for (const [field, raw] of Object.entries(overrides)) {
        const v = transformFieldValue(field, raw)
        if (v) parent[field] = v
        else delete parent[field]
      }
    }
    const sku = (parent[F.sku] ?? '').trim()

    // Price derivations, e.g. «سعر التكلفة = سعر المنتج − 30%» or «السعر المخفض
    // = سعر المنتج − 10%». Runs AFTER the manual overrides so an edited price
    // feeds the formula, and BEFORE variant expansion so a derived discount
    // flows down to the خيار rows.
    if (config.priceRules?.length) {
      const prices = applyPriceRules(
        {
          price: parent[F.price] ?? '',
          salePrice: parent[F.discountPrice] ?? '',
          cost: parent[F.cost] ?? '',
        },
        config.priceRules,
      )
      setOrClear(parent, F.price, prices.price)
      setOrClear(parent, F.discountPrice, prices.salePrice)
      setOrClear(parent, F.cost, prices.cost)
    }

    // العنوان الترويجي: clamp to Salla's 25 chars and, when nothing was mapped
    // or typed, derive it from the name/description (both configurable).
    const promo = promoTitleFor(parent, config)
    if (promo) parent[F.promoTitle] = promo
    else delete parent[F.promoTitle]

    // Only options that actually have values for THIS row become groups —
    // re-indexed sequentially (1..3) so the parent never declares an option
    // group that has no خيار values (which Salla rejects).
    const axes = rowAxes(
      row,
      config.options.filter((o) => o.column),
      optionOverrides[index],
    )
    axes.forEach(({ opt }, i) => {
      const cols = optionGroupCols((i + 1) as 1 | 2 | 3)
      parent[cols.name] = opt.name
      parent[cols.type] = OPTION_TYPES[opt.type]
      parent[cols.value] = OPTION_VALUE_PLACEHOLDER
    })

    applyDefaults(parent, config, true)
    out.push(parent)
    meta.push({
      sourceIndex: index,
      isProduct: true,
      ...(axes.length
        ? { axes: axes.map((a) => ({ axisIndex: a.index, name: a.opt.name })) }
        : {}),
    })
    productCount++

    // Expand variants (cartesian product of the populated axes).
    if (axes.length) {
      const combos = optionCombos(row, axes)
      for (const combo of combos) {
        if (combo.length === 0) continue
        const variant: SallaRow = { [F.type]: ROW_OPTION }

        // Inherit price / discount from parent.
        if (parent[F.price]) variant[F.price] = parent[F.price]
        if (parent[F.discountPrice]) variant[F.discountPrice] = parent[F.discountPrice]

        // Variant SKU = {parentSku}-{value1-value2...}
        const comboValues = combo.map((c) => c.value).join('-')
        if (sku) variant[F.sku] = `${sku}-${comboValues}`

        // Fill each option group's actual value (+ swatch for colors), keyed
        // by the axis position so it matches the parent's declared group.
        for (const c of combo) {
          const groupIndex = axes.findIndex((a) => a.opt === c.opt)
          const gcols = optionGroupCols((groupIndex + 1) as 1 | 2 | 3)
          variant[gcols.value] = c.value
          if (c.swatch) variant[gcols.swatch] = c.swatch
        }

        applyDefaults(variant, config, false)
        out.push(variant)
        meta.push({
          sourceIndex: index,
          isProduct: false,
          picks: combo.map((c) => ({
            axisIndex: c.axisIndex,
            original: c.original,
            value: c.value,
          })),
        })
        optionCount++
      }
    }
  })

  return { rows: out, meta, productCount, optionCount }
}

/* ------------------------------ validation ------------------------------- */

export interface Issue {
  /** Stable code for i18n lookup (e.g. 'missingPrice'). */
  code: string
  /** Arabic fallback text (used if a translation is missing). */
  message: string
  count: number
  /** Language-neutral pointers to the first few offending rows, e.g. «قميص» (#5). */
  examples?: string[]
}

export interface Validation {
  errors: Issue[]
  warnings: Issue[]
  ok: boolean
}

/** Max row pointers collected per issue, so long files don't flood the UI. */
const MAX_EXAMPLES = 8

/**
 * Spreadsheet row number for a 0-based data index.
 * Output layout: row 1 = section label, row 2 = headers, data starts at row 3.
 */
function sheetRowNumber(dataIndex: number): number {
  return dataIndex + 3
}

/** Language-neutral row pointer, e.g. «قميص» (#5) or just #5 when unnamed. */
function locate(row: SallaRow, index: number): string {
  const name = row[F.name]?.trim()
  const rowNo = sheetRowNumber(index)
  return name ? `«${name}» (#${rowNo})` : `#${rowNo}`
}

/** A running tally: total count + a capped sample of row pointers. */
interface Bucket {
  count: number
  examples: string[]
}

function newBucket(): Bucket {
  return { count: 0, examples: [] }
}

function hit(bucket: Bucket, label: string) {
  bucket.count++
  if (bucket.examples.length < MAX_EXAMPLES) bucket.examples.push(label)
}

function issue(code: string, message: string, bucket: Bucket): Issue | null {
  return bucket.count
    ? { code, message, count: bucket.count, examples: bucket.examples }
    : null
}

/**
 * Safety-net check that an option NAME didn't leak a scrape selector into the
 * output (mirrors `isSelectorLike` in product.ts — kept local to avoid a
 * build↔product import cycle). Names are sanitized upstream, so a hit here is
 * a hard bug.
 */
const SELECTOR_WORDS = ['span', 'grid', 'mode', 'product-options', 'ctr', 'button']
function looksLikeSelectorName(name: string): boolean {
  const n = name.trim().toLowerCase()
  if (!n) return false
  if (/^_.*_[a-z0-9]{4,}_?\d*$/i.test(n)) return true
  return n.includes('-') && SELECTOR_WORDS.some((w) => n.includes(w))
}

/** The three option-group column keys for name / value lookups. */
const OPTION_GROUPS = [optionGroupCols(1), optionGroupCols(2), optionGroupCols(3)]

export function validate(rows: SallaRow[]): Validation {
  const missingName = newBucket()
  const missingPrice = newBucket()
  const missingWeight = newBucket()
  const missingImage = newBucket()
  const imageNotUrl = newBucket()
  const imageNotImage = newBucket()
  const missingCategory = newBucket()
  const missingBrand = newBucket()
  const orphanOptions = newBucket()
  const emptyOptionValue = newBucket()
  const missingOptionName = newBucket()
  const selectorName = newBucket()
  const promoTitleTooLong = newBucket()

  const skuSeen = new Map<string, number>()
  let lastWasProductOrHasParent = false

  rows.forEach((row, index) => {
    const kind = row[F.type]
    if (kind === ROW_PRODUCT) {
      lastWasProductOrHasParent = true
      if (!row[F.name]?.trim()) hit(missingName, `#${sheetRowNumber(index)}`)
      if (!cleanPrice(row[F.price] ?? '')) hit(missingPrice, locate(row, index))
      if (!row[F.image]?.trim()) hit(missingImage, locate(row, index))
      else {
        // Salla only accepts real image links here, and a scraped sheet happily
        // hands us a product-page URL or plain text. Report both, separately:
        // "not a link at all" and "a link, but nothing says it's an image".
        const kinds = splitValues(row[F.image] ?? '').map(classifyUrl)
        if (kinds.includes('notUrl')) hit(imageNotUrl, locate(row, index))
        else if (kinds.includes('link')) hit(imageNotImage, locate(row, index))
      }
      if (!row[F.category]?.trim()) hit(missingCategory, locate(row, index))
      if (!row[F.brand]?.trim()) hit(missingBrand, locate(row, index))
      // A group is "declared" by the placeholder sitting in its value cell —
      // Salla rejects one that carries no name (e.g. cleared in the preview).
      if (
        OPTION_GROUPS.some(
          (g) => row[g.value] === OPTION_VALUE_PLACEHOLDER && !row[g.name]?.trim(),
        )
      )
        hit(missingOptionName, locate(row, index))
      // Any declared option group whose name looks like a scrape selector.
      if (OPTION_GROUPS.some((g) => looksLikeSelectorName(row[g.name] ?? '')))
        hit(selectorName, locate(row, index))
      // العنوان الترويجي: Salla rejects import over 25 chars.
      if ((row[F.promoTitle] ?? '').trim().length > SALLA_PROMO_TITLE_MAX)
        hit(promoTitleTooLong, locate(row, index))
    } else if (kind === ROW_OPTION) {
      if (!lastWasProductOrHasParent) hit(orphanOptions, `#${sheetRowNumber(index)}`)
      // A خيار row must carry at least one real option value.
      if (!OPTION_GROUPS.some((g) => (row[g.value] ?? '').trim()))
        hit(emptyOptionValue, `#${sheetRowNumber(index)}`)
    }

    // Weight is required on BOTH product and option rows.
    if (!row[F.weight]?.trim()) hit(missingWeight, locate(row, index))

    // Duplicate SKUs (only count non-empty).
    const sku = row[F.sku]?.trim()
    if (sku) skuSeen.set(sku, (skuSeen.get(sku) ?? 0) + 1)
  })

  const dupSkus = [...skuSeen.values()].filter((c) => c > 1).length

  const errors = [
    issue('missingName', 'صفوف بدون اسم منتج (أسم المنتج مطلوب)', missingName),
    issue('missingPrice', 'منتجات بدون سعر (سعر المنتج مطلوب)', missingPrice),
    issue('missingWeight', 'صفوف بدون وزن (حقل الوزن مطلوب)', missingWeight),
    dupSkus ? { code: 'dupSku', message: 'أرقام SKU مكررة', count: dupSkus } : null,
    issue('orphan', 'صفوف خيار بدون منتج أب', orphanOptions),
    issue('emptyOptionValue', 'صفوف خيار بدون قيمة', emptyOptionValue),
    issue('missingOptionName', 'منتجات لها خيار بدون اسم', missingOptionName),
    issue('selectorName', 'أسماء خيارات تبدو كمُحدِّد برمجي', selectorName),
    issue(
      'promoTitleTooLong',
      `العنوان الترويجي يتجاوز ${SALLA_PROMO_TITLE_MAX} حرفًا`,
      promoTitleTooLong,
    ),
  ].filter((i): i is Issue => i !== null)

  const warnings = [
    issue('missingImage', 'منتجات بدون صورة', missingImage),
    issue('imageNotUrl', 'خانة الصور تحتوي نصًا ليس رابطًا', imageNotUrl),
    issue('imageNotImage', 'روابط صور لا تبدو صورة (قد تكون رابط صفحة)', imageNotImage),
    issue('missingCategory', 'منتجات بدون تصنيف', missingCategory),
    issue('missingBrand', 'منتجات بدون ماركة', missingBrand),
  ].filter((i): i is Issue => i !== null)

  return { errors, warnings, ok: errors.length === 0 }
}
