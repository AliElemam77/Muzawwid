import { F } from './salla'
import { isSelectorLike } from './product'
import { emptyConfig, type MappingConfig } from './types'
import type { SourceSheet, SourceRow } from './reader'

/** Normalize a header for loose matching (lowercase, strip punctuation/diacritics). */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, '') // Arabic diacritics
    .replace(/[إأآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[_\-./|[\]()#*:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Keyword banks per Salla field. A header matches if it contains any keyword. */
const FIELD_HINTS: { field: string; keys: string[] }[] = [
  { field: F.name, keys: ['title', 'name', 'product card title', 'product-card__title', 'اسم', 'أسم', 'المنتج'] },
  { field: F.price, keys: ['price', 'total price', 'total-price', 'سعر', 'السعر'] },
  { field: F.sku, keys: ['sku', 'رمز', 'كود', 'code'] },
  { field: F.brand, keys: ['brand', 'الماركه', 'ماركه', 'العلامه'] },
  { field: F.category, keys: ['category', 'cat', 'تصنيف', 'القسم', 'فئه'] },
  { field: F.barcode, keys: ['barcode', 'باركود'] },
  { field: F.cost, keys: ['cost', 'التكلفه', 'تكلفه'] },
  { field: F.weight, keys: ['weight', 'الوزن', 'وزن'] },
  { field: F.description, keys: ['description', 'desc', 'الوصف', 'وصف', 'details', 'تفاصيل'] },
  { field: F.discountPrice, keys: ['discount', 'sale price', 'المخفض', 'تخفيض', 'خصم'] },
  { field: F.mpn, keys: ['mpn'] },
  { field: F.gtin, keys: ['gtin'] },
  { field: F.promoTitle, keys: ['promo', 'العنوان الترويجي', 'ترويجي'] },
]

const IMAGE_KEYS = ['image', 'img', 'src', 'photo', 'picture', 'صوره', 'صورة', 'h full src', 'second image src', 'go to slide src', 'thumbnail']

function matchField(header: string): string | null {
  const h = norm(header)
  for (const { field, keys } of FIELD_HINTS) {
    if (keys.some((k) => h.includes(norm(k)))) return field
  }
  return null
}

function looksLikeImage(header: string): boolean {
  const h = norm(header)
  return IMAGE_KEYS.some((k) => h.includes(norm(k)))
}

/* --------------------------- option classification ------------------------ */
/*
 * A source column becomes an option ONLY if it passes a whitelist (a real
 * size/color/variant signal from its header OR its values) AND fails a
 * blacklist (scrape selectors, URLs/links, CSS hashes, mostly-empty or
 * all-identical columns). This stops junk columns like `reviews href` or
 * `_buttonOptionsCtr_14os5_1` from being mapped as options — the root cause of
 * the "خيار بدون منتج أب" / "مطلوب في صف المنتج" import failures.
 */

/** Header substrings that disqualify a column from ever being an option. */
const OPTION_BLACKLIST = /href|url|link|src|image|img|slide|rating|review|ctr|span|grid|mode|button|price|title|\bsku\b/i
/** A CSS-module hash header, e.g. `_buttonOptionsCtr_14os5_1`. */
const CSS_HASH = /^_.*_[a-z0-9]{4,}_?\d*$/i
const URL_RE = /^https?:\/\//i

function headerBlacklisted(header: string): boolean {
  const h = header.trim()
  return CSS_HASH.test(h) || OPTION_BLACKLIST.test(h) || isSelectorLike(h)
}

/** Read up to `limit` rows: total scanned + the non-empty trimmed values. */
function columnValues(rows: SourceRow[], column: string, limit = 60): { total: number; values: string[] } {
  let total = 0
  const values: string[] = []
  for (const row of rows) {
    if (total >= limit) break
    total++
    const v = (row[column] ?? '').trim()
    if (v) values.push(v)
  }
  return { total, values }
}

function valuesBlacklisted(total: number, values: string[]): boolean {
  if (values.length === 0) return true // entirely empty
  if (total > 0 && values.length / total < 0.3) return true // mostly empty
  if (values.filter((v) => URL_RE.test(v)).length / values.length > 0.3) return true // mostly URLs
  const distinct = new Set(values)
  if (values.length > 1 && distinct.size === 1) return true // all identical → not an axis
  if (distinct.size > 50) return true // implausibly many → likely a bad column
  return false
}

const SIZE_WORDS = ['size', 'sizes', 'مقاس', 'المقاس', 'مقاسات']
const COLOR_WORDS = ['color', 'colour', 'colors', 'لون', 'اللون', 'الالوان']
const VARIANT_WORDS = ['variant', 'variants', 'option value', 'option', 'options', 'خيار', 'خيارات']

const SIZE_TOKEN = /^(x{0,2}s|x{0,2}l|m|\d{1,3}(\.\d+)?\s?(eu|us|uk|cm|mm)?)$/i
const COLOR_NAMES = [
  'red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'gray', 'grey',
  'brown', 'orange', 'purple', 'beige', 'gold', 'silver', 'navy',
  'احمر', 'ازرق', 'اخضر', 'اسود', 'ابيض', 'اصفر', 'وردي', 'رمادي', 'بني',
  'برتقالي', 'بنفسجي', 'ذهبي', 'فضي', 'بيج', 'كحلي',
]

function fracMatch(values: string[], pred: (v: string) => boolean): number {
  return values.length ? values.filter(pred).length / values.length : 0
}
function isHexColor(v: string): boolean {
  return /^#?[0-9a-f]{3,8}$/i.test(v.trim())
}
function valuesLookLikeSizes(values: string[]): boolean {
  return fracMatch(values, (v) => SIZE_TOKEN.test(v.trim())) >= 0.6
}
function valuesLookLikeColors(values: string[]): boolean {
  return fracMatch(values, (v) => isHexColor(v) || COLOR_NAMES.includes(norm(v))) >= 0.6
}

type OptionSignal = 'size' | 'color' | 'variant' | null
function headerSignal(header: string): OptionSignal {
  const h = norm(header)
  if (COLOR_WORDS.some((k) => h.includes(norm(k)))) return 'color'
  if (SIZE_WORDS.some((k) => h.includes(norm(k)))) return 'size'
  if (VARIANT_WORDS.some((k) => h.includes(norm(k)))) return 'variant'
  return null
}

/**
 * Decide if a column is an option and, if so, give it a clean human name +
 * type. Returns null when the column is blacklisted or fails the whitelist.
 * The name is derived from the size/color signal — never the raw header when
 * that header looks like a selector/hash.
 */
function detectOption(
  header: string,
  total: number,
  values: string[],
): { name: string; type: 'text' | 'color' } | null {
  if (headerBlacklisted(header)) return null
  if (valuesBlacklisted(total, values)) return null

  const sig = headerSignal(header)
  const sizeVals = valuesLookLikeSizes(values)
  const colorVals = valuesLookLikeColors(values)
  if (!sig && !sizeVals && !colorVals) return null // fails whitelist

  if (sig === 'color' || (sig !== 'size' && colorVals)) return { name: 'اللون', type: 'color' }
  if (sig === 'size' || sizeVals) return { name: 'المقاس', type: 'text' }

  // A generic variant signal: keep a clean header, else fall back to خيار.
  const clean = !isSelectorLike(header) && header.trim().length <= 40 && !/[_]/.test(header) && !/^\d+$/.test(header.trim())
  return { name: clean ? header.trim() : 'خيار', type: 'text' }
}

/* ------------------------------- entry point ----------------------------- */

/**
 * Produce an initial MappingConfig by fuzzy-matching source headers and
 * inspecting sample values. Everything remains editable in the UI.
 */
export function autoMap(sheet: SourceSheet): MappingConfig {
  const headers = sheet.headers
  const rows = sheet.rows
  const config = emptyConfig()
  const usedForField = new Set<string>()

  // Images first (multi-select merge).
  const imageCols = headers.filter(looksLikeImage)
  config.imageColumns = imageCols

  // Options, value-aware. Columns that share an option name (e.g. several
  // scraped "color" columns, or size / size (2)) are ALL kept with that same
  // name — the builder then merges their values into ONE axis. Only the number
  // of DISTINCT axis names is capped at 3, matching the Salla/Zid templates
  // (which provide exactly three option groups).
  const optionCols: string[] = []
  const axisNames = new Set<string>()
  for (const header of headers) {
    if (imageCols.includes(header)) continue
    const { total, values } = columnValues(rows, header)
    const det = detectOption(header, total, values)
    if (!det) continue
    const key = norm(det.name)
    // A NEW distinct axis beyond the third can't be exported — skip it. Columns
    // reusing an existing axis name are always kept (they merge into that axis).
    if (!axisNames.has(key) && axisNames.size >= 3) continue
    axisNames.add(key)
    config.options.push({ column: header, name: det.name, type: det.type })
    optionCols.push(header)
  }

  // Simple fields — skip headers already used for images/options.
  const claimed = new Set([...imageCols, ...optionCols])
  for (const header of headers) {
    if (claimed.has(header)) continue
    const field = matchField(header)
    if (field && !usedForField.has(field)) {
      config.fields[field] = { kind: 'column', column: header }
      usedForField.add(field)
    }
  }

  // SKU: if a sku-like column matched, use it; else leave as none for the user to choose.
  if (config.fields[F.sku]?.kind === 'column') {
    config.sku = { mode: 'column', column: (config.fields[F.sku] as { column: string }).column }
  }

  return config
}
