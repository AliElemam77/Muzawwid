import * as XLSX from 'xlsx'
import { isSelectorLike, type Product } from '../product'
import type { Validation, Issue } from '../build'
import type { ExportAdapter } from './types'

/**
 * Zid bulk-import format (based on import_products_example_2025).
 * Structurally unrelated to Salla: ONE sheet "Sheet1", TWO header rows, and
 * ONE row per product — variants live inline via has_variants + option1..3.
 */

export const ZID_SHEET_NAME = 'Sheet1'
export const ZID_COLUMN_COUNT = 111

/** Row 2 — the 111 machine keys in exact order. */
export const ZID_HEADERS: string[] = (
  'sku,name_ar,name_en,weight_unit,weight,price,sale_price,cost,quantity,' +
  'categories_ar,categories_en,categories_description_ar,categories_description_en,' +
  'categories_images,published,images,images_alt_text,vat_free,' +
  'minimum_quantity_per_order,maximum_quantity_per_order,shipping_required,barcode,' +
  'keywords,description_ar,description_en,short_description_ar,short_description_en,' +
  'product_page_title_ar,product_page_title_en,product_page_description_ar,' +
  'product_page_description_en,product_page_url,has_variants,' +
  'option1_name_ar,option1_name_en,option1_value_ar,option1_value_en,' +
  'option2_name_ar,option2_name_en,option2_value_ar,option2_value_en,' +
  'option3_name_ar,option3_name_en,option3_value_ar,option3_value_en,' +
  'has_dropdown,is_dropdown_required,dropdown_name_ar,dropdown_name_en,' +
  'dropdown_choice1_ar,dropdown_choice1_en,dropdown_choice1_price,' +
  'dropdown_choice2_ar,dropdown_choice2_en,dropdown_choice2_price,' +
  'dropdown_choice3_ar,dropdown_choice3_en,dropdown_choice3_price,' +
  'has_text_input,is_text_input_required,text_input_name_ar,text_input_name_en,' +
  'text_input_price,has_multiple_options,is_multiple_options_required,' +
  'multiple_options_name_ar,multiple_options_name_en,' +
  'multiple_options_choice1_ar,multiple_options_choice1_en,multiple_options_choice1_price,' +
  'multiple_options_choice2_ar,multiple_options_choice2_en,multiple_options_choice2_price,' +
  'multiple_options_choice3_ar,multiple_options_choice3_en,multiple_options_choice3_price,' +
  'has_numerical_input,is_numerical_input_required,numerical_input_name_ar,' +
  'numerical_input_name_en,numerical_input_price,has_date,is_date_required,' +
  'date_name_ar,date_name_en,has_time,is_time_required,time_name_ar,time_name_en,' +
  'has_image_upload,is_image_upload_required,image_upload_name_ar,image_upload_name_en,' +
  'has_file_upload,is_file_upload_required,file_upload_name_ar,file_upload_name_en,' +
  'filtration_attribute_1_ar,filtration_attribute_1_en,filtration_value_1_ar,' +
  'filtration_value_1_en,filtration_type_value_1_ar,filtration_type_value_1_en,' +
  'filtration_type_1,filtration_attribute_2_ar,filtration_attribute_2_en,' +
  'filtration_value_2_ar,filtration_value_2_en,filtration_type_value_2_ar,' +
  'filtration_type_value_2_en,filtration_type_2'
).split(',')

/** Row 1 — section group labels at their 1-based column positions. */
const ZID_GROUP_LABELS: { col: number; label: string }[] = [
  { col: 2, label: 'المعلومات الأساسية - General Details' },
  { col: 23, label: 'وصف المنتج - Product Description' },
  { col: 28, label: 'تحسينات محركات البحث  - SEO Enhanamcent' },
  { col: 33, label: 'خيارات المنتج (غير أساسية) - Products Options' },
  { col: 46, label: 'إضافات المنتج (غير أساسية) - Product Additions' },
  { col: 98, label: 'Product Filtration - (غير أساسية) معايير التصفية' },
]

/** Build the group-label header row (index 0), padded to 111 columns. */
export function zidGroupRow(): string[] {
  const row = new Array<string>(ZID_COLUMN_COUNT).fill('')
  for (const { col, label } of ZID_GROUP_LABELS) row[col - 1] = label
  return row
}

/* ------------------------------- defaults -------------------------------- */

/** Zid defaults applied when a value is empty/unspecified. */
function withDefaults(p: Product) {
  return {
    weight: p.weight.trim() || '1',
    weightUnit: p.weightUnit.trim() || 'kg',
    published: p.published ?? true,
    vatFree: p.vatFree ?? false,
    shippingRequired: p.shippingRequired ?? true,
  }
}

const yn = (b: boolean) => (b ? 'Yes' : 'No')

// SKU generation: an empty SKU is filled from an uppercase slug of the name;
// each variant becomes `{PARENT_SKU}-{OPTION1_VALUE}`. Uniqueness is enforced
// across the whole export via `SkuAllocator` (see below).

/**
 * Zid's `product_page_url` is a SEO *slug*, not a full URL — it must be
 * letters, numbers and dashes only (Zid rejects `https://…/p123?x=1` with
 * "أدخل رابطًا صالحًا يتكون من أحرف أو ارقام أو شَرطات فقط"). Reduce a scraped
 * URL to a valid slug: decode it, drop scheme/host/query/hash, then collapse
 * every non letter/number run into a single dash. Arabic letters are kept
 * (Zid allows Arabic slugs); an empty input stays empty.
 */
export function toSlug(url: string): string {
  let s = url.trim()
  if (!s) return ''
  try {
    s = decodeURIComponent(s)
  } catch {
    /* leave as-is if it isn't valid percent-encoding */
  }
  return s
    .replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, '') // drop scheme://host
    .replace(/[?#].*$/, '') // drop query / hash
    .replace(/[^\p{L}\p{N}]+/gu, '-') // non letter/number → dash
    .replace(/^-+|-+$/g, '') // trim leading/trailing dashes
    .toLowerCase()
}

/* ------------------------- spec normalizations --------------------------- */

/** Lower-cased, whitespace-collapsed key for map lookups (Arabic is untouched). */
function normKey(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase()
}

const hasLatin = (s: string) => /[A-Za-z]/.test(s)

/** Common size labels → Salla/Zid English tokens (XXS–XXL). */
const SIZE_EN: Record<string, string> = {
  xxs: 'XXS', xs: 'XS', s: 'S', m: 'M', l: 'L', xl: 'XL', xxl: 'XXL',
  'صغير جدا جدا': 'XXS', 'صغير جدا': 'XS', صغير: 'S',
  متوسط: 'M', وسط: 'M', كبير: 'L', 'كبير جدا': 'XL', 'كبير جدا جدا': 'XXL',
}

/** Standard color names (Arabic, incl. hamza variants) → English. */
const COLOR_EN: Record<string, string> = {
  أحمر: 'Red', احمر: 'Red', أزرق: 'Blue', ازرق: 'Blue', أخضر: 'Green', اخضر: 'Green',
  أصفر: 'Yellow', اصفر: 'Yellow', أسود: 'Black', اسود: 'Black', أبيض: 'White', ابيض: 'White',
  رمادي: 'Gray', بني: 'Brown', برتقالي: 'Orange', وردي: 'Pink', زهري: 'Pink',
  بنفسجي: 'Purple', موف: 'Purple', ذهبي: 'Gold', فضي: 'Silver', بيج: 'Beige', كحلي: 'Navy',
}

/** Common option-axis names → English. */
const OPTION_NAME_EN: Record<string, string> = {
  المقاس: 'Size', مقاس: 'Size', الحجم: 'Size', حجم: 'Size',
  اللون: 'Color', لون: 'Color', النوع: 'Type', الموديل: 'Model',
  الخامة: 'Material', المادة: 'Material',
}

/**
 * English for an option VALUE: predefined size/color mapping first, then a
 * direct copy when the source already carries Latin text, else empty.
 */
export function toEnglishValue(ar: string): string {
  const raw = ar.trim()
  if (!raw) return ''
  const key = normKey(raw)
  if (key in SIZE_EN) return SIZE_EN[key]
  if (key in COLOR_EN) return COLOR_EN[key]
  return hasLatin(raw) ? raw : ''
}

/**
 * English for a free-text field (name, short description, page title): keep any
 * value already provided, else copy the original only when it contains Latin
 * text (no machine translation — that path is intentionally out of scope).
 */
export function toEnglishText(ar: string, existing: string): string {
  if (existing.trim()) return existing.trim()
  const raw = ar.trim()
  return hasLatin(raw) ? raw : ''
}

/** English for an option NAME: provided value, then name map, then Latin copy. */
export function toEnglishOptionName(ar: string, existing: string): string {
  if (existing.trim()) return existing.trim()
  const raw = ar.trim()
  if (!raw) return ''
  const key = normKey(raw)
  if (key in OPTION_NAME_EN) return OPTION_NAME_EN[key]
  return hasLatin(raw) ? raw : ''
}

/** Normalize any weight unit to exactly `Kg` or `g` (case-sensitive). */
export function normalizeWeightUnit(u: string): string {
  const k = normKey(u).replace(/[.\s]/g, '')
  if (['g', 'gr', 'gram', 'grams', 'جم', 'غم', 'جرام', 'غرام'].includes(k)) return 'g'
  return 'Kg'
}

/** Fields emitted as real numbers (not strings) in the workbook. */
const NUMERIC_FIELDS = new Set([
  'weight', 'price', 'sale_price', 'cost',
  'minimum_quantity_per_order', 'maximum_quantity_per_order',
])

/** Coerce a numeric field to a Number; empty → '', non-numeric → the raw string. */
export function toNumber(v: string): number | string {
  const s = String(v ?? '').trim()
  if (s === '') return ''
  const n = Number(s.replace(/[,،\s]/g, ''))
  return Number.isFinite(n) ? n : s
}

/** Quantity → integer, unless it is an explicit "infinite" marker (kept as-is). */
export function toQuantity(v: string): number | string {
  const s = String(v ?? '').trim()
  if (s === '') return ''
  if (/^(infinite|infinity|∞|غير\s*محدود|لا\s*نهائي)$/i.test(s)) return s
  const n = Number(s.replace(/[,،\s]/g, ''))
  return Number.isFinite(n) ? Math.trunc(n) : s
}

const BOOL_TRUE = new Set(['true', '1', 'yes', 'y', 'on', 'نعم', 'مفعل', 'مطلوب', 'متاح'])

/** Normalize a boolean-ish value to exactly `Yes`/`No`; empty stays empty. */
export function normalizeBoolean(v: string): string {
  const s = normKey(v)
  if (s === '') return ''
  return BOOL_TRUE.has(s) ? 'Yes' : 'No'
}

/** Columns that must read exactly Yes/No: flags + every `is_*_required`. */
function isBooleanField(key: string): boolean {
  return (
    key === 'published' ||
    key === 'vat_free' ||
    key === 'shipping_required' ||
    key.startsWith('has_') ||
    /^is_.*_required$/.test(key)
  )
}

/** A URL's identity for dedup — everything before its query/hash. */
function imageIdentity(url: string): string {
  return url.split(/[?#]/)[0]
}

/** The `width` query value (0 when absent), used to pick the best duplicate. */
function imageWidth(url: string): number {
  const m = /[?&]width=(\d+)/i.exec(url)
  return m ? Number(m[1]) : 0
}

/**
 * Deduplicate image URLs ignoring query parameters; when several URLs share a
 * base, keep the one with the highest `width`. First-seen order is preserved.
 */
export function dedupeImages(urls: string[]): string[] {
  const best = new Map<string, string>()
  const order: string[] = []
  for (const raw of urls) {
    const url = raw.trim()
    if (!url) continue
    const id = imageIdentity(url)
    const prev = best.get(id)
    if (prev === undefined) {
      best.set(id, url)
      order.push(id)
    } else if (imageWidth(url) > imageWidth(prev)) {
      best.set(id, url)
    }
  }
  return order.map((id) => best.get(id)!)
}

const HTML_RE = /<[a-z!/][^>]*>/i

/**
 * Turn literal `\n` (and `\r\n`/`\r`) escape sequences into real newlines. If
 * the text already contains HTML markup, it is left exactly as-is.
 */
export function formatDescription(text: string): string {
  const s = text ?? ''
  if (!s) return ''
  if (HTML_RE.test(s)) return s
  return s.replace(/\\r\\n|\\n|\\r/g, '\n')
}

/** Uppercase hyphen slug: keep letters/numbers (Latin + Arabic), rest → '-'. */
export function slugify(s: string): string {
  return s
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase()
}

/** Hands out globally-unique SKUs, appending -2/-3/… on collision. */
class SkuAllocator {
  private readonly seen = new Set<string>()
  take(base: string): string {
    if (!base) return ''
    let candidate = base
    let n = 2
    while (this.seen.has(candidate)) candidate = `${base}-${n++}`
    this.seen.add(candidate)
    return candidate
  }
}

/** Parent SKU: the given value, else an uppercase slug of the English/Arabic name. */
function productSku(p: Product, alloc: SkuAllocator): string {
  const base = p.sku.trim() || slugify(p.nameEn.trim() || p.nameAr.trim())
  return alloc.take(base)
}

/**
 * A usable variant axis needs BOTH a name and at least one value. An axis with
 * values but no name can't produce named sub-products in Zid — including it
 * would set has_variants=Yes with nothing usable, which Zid rejects.
 */
function validAxes(p: Product) {
  return p.options.filter((o) => o.nameAr.trim() !== '' && o.values.length > 0).slice(0, 3)
}

/** A product that has option values but left the option unnamed. */
function hasUnnamedOption(p: Product): boolean {
  return p.options.some((o) => o.values.length > 0 && o.nameAr.trim() === '')
}

/* ------------------------------- serialize ------------------------------- */

/** The product's main (non-option) fields, with Zid defaults applied. */
function baseRecord(p: Product): Record<string, string> {
  const d = withDefaults(p)
  return {
    sku: p.sku,
    name_ar: p.nameAr,
    name_en: toEnglishText(p.nameAr, p.nameEn),
    weight_unit: normalizeWeightUnit(d.weightUnit),
    weight: d.weight,
    price: p.price,
    sale_price: p.salePrice,
    cost: p.cost,
    quantity: p.quantity,
    categories_ar: p.categoriesAr,
    // Mirror the Arabic categories when the English side is missing.
    categories_en: p.categoriesEn || p.categoriesAr,
    published: yn(d.published),
    images: dedupeImages(p.images).join(','),
    images_alt_text: p.imagesAlt,
    product_page_url: toSlug(p.productPageUrl),
    vat_free: yn(d.vatFree),
    shipping_required: yn(d.shippingRequired),
    barcode: p.barcode,
    keywords: p.keywords,
    description_ar: formatDescription(p.descriptionAr),
    description_en: formatDescription(toEnglishText(p.descriptionAr, p.descriptionEn)),
    short_description_ar: formatDescription(p.shortDescAr),
    short_description_en: formatDescription(toEnglishText(p.shortDescAr, p.shortDescEn)),
    product_page_title_ar: p.seoTitleAr,
    product_page_title_en: toEnglishText(p.seoTitleAr, p.seoTitleEn),
    product_page_description_ar: p.metaDescAr,
    product_page_description_en: p.metaDescEn,
  }
}

/** A serialized cell — a real Number for numeric fields, otherwise a string. */
type Cell = string | number

/** Apply per-column type/format coercion (numeric, quantity int, Yes/No). */
function coerceCell(key: string, raw: string): Cell {
  if (NUMERIC_FIELDS.has(key)) return toNumber(raw)
  if (key === 'quantity') return toQuantity(raw)
  if (isBooleanField(key)) return normalizeBoolean(raw)
  return raw
}

const toRow = (rec: Record<string, string>): Cell[] =>
  ZID_HEADERS.map((k) => coerceCell(k, rec[k] ?? ''))

/** Cartesian product of each axis's values → one value-tuple per combination. */
function combinations(axes: { values: string[] }[]): string[][] {
  return axes.reduce<string[][]>(
    (acc, axis) => {
      const next: string[][] = []
      for (const combo of acc) for (const v of axis.values) next.push([...combo, v])
      return next
    },
    [[]],
  )
}

/**
 * Serialize to Zid's parent + child variant model:
 *  - Product with no valid option axes → a single row (has_variants = No).
 *  - Product with variants → a PARENT row (main fields, has_variants = Yes,
 *    option NAMES set, option VALUES empty) followed by one CHILD row per
 *    combination (only option VALUES set; everything else empty).
 */
export function serialize(products: Product[]): XLSX.WorkBook {
  const aoa: Cell[][] = []
  aoa.push(zidGroupRow()) // row 1
  aoa.push([...ZID_HEADERS]) // row 2

  const alloc = new SkuAllocator()

  for (const p of products) {
    const axes = validAxes(p)
    const sku = productSku(p, alloc)

    if (axes.length === 0) {
      const rec = baseRecord(p)
      rec.sku = sku
      rec.has_variants = 'No'
      aoa.push(toRow(rec))
      continue
    }

    // Parent: names only, values empty.
    const parent = baseRecord(p)
    parent.sku = sku
    parent.has_variants = 'Yes'
    axes.forEach((a, i) => {
      parent[`option${i + 1}_name_ar`] = a.nameAr
      parent[`option${i + 1}_name_en`] = toEnglishOptionName(a.nameAr, a.nameEn)
    })
    aoa.push(toRow(parent))

    // One child per combination. Variants carry their option values (+ English),
    // a `{parent}-{option1}` SKU, and inherit price/quantity from the parent
    // (every variant row must have both); other fields stay empty for Zid to
    // inherit from the parent.
    for (const combo of combinations(axes)) {
      const child: Record<string, string> = {}
      combo.forEach((v, i) => {
        child[`option${i + 1}_value_ar`] = v
        child[`option${i + 1}_value_en`] = toEnglishValue(v)
      })
      // Variant SKU uses OPTION1's value, per spec; uniqueness handles collisions.
      child.sku = sku ? alloc.take(`${sku}-${slugify(combo[0])}`) : ''
      child.price = p.price // inherit parent price
      child.quantity = p.quantity // inherit parent quantity
      aoa.push(toRow(child))
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, ZID_SHEET_NAME)
  // Guarantee exactly one sheet with the required name.
  wb.SheetNames = [ZID_SHEET_NAME]
  wb.Sheets = { [ZID_SHEET_NAME]: ws }
  return wb
}

/* ------------------------------- validate -------------------------------- */

const MAX_EXAMPLES = 8

/** Data rows start at spreadsheet row 3 (two header rows precede them). */
function locate(p: Product, index: number): string {
  const rowNo = index + 3
  return p.nameAr.trim() ? `«${p.nameAr.trim()}» (#${rowNo})` : `#${rowNo}`
}

interface Bucket {
  count: number
  examples: string[]
}
const bucket = (): Bucket => ({ count: 0, examples: [] })
function hit(b: Bucket, label: string) {
  b.count++
  if (b.examples.length < MAX_EXAMPLES) b.examples.push(label)
}
function toIssue(code: string, message: string, b: Bucket): Issue | null {
  return b.count ? { code, message, count: b.count, examples: b.examples } : null
}

/** Ar fields whose missing En counterpart produces a (non-blocking) warning. */
function missingEnglish(p: Product): boolean {
  if (p.nameAr.trim() && !p.nameEn.trim()) return true
  if (p.categoriesAr.trim() && !p.categoriesEn.trim()) return true
  if (p.descriptionAr.trim() && !p.descriptionEn.trim()) return true
  if (p.shortDescAr.trim() && !p.shortDescEn.trim()) return true
  for (const o of p.options) {
    if (o.nameAr.trim() && !o.nameEn.trim()) return true
  }
  return false
}

export function validate(products: Product[]): Validation {
  const missingName = bucket()
  const missingPrice = bucket()
  const missingWeight = bucket()
  const selectorOption = bucket()
  const orphanParent = bucket()
  const noEnglish = bucket()
  const unnamedOption = bucket()

  products.forEach((p, i) => {
    const d = withDefaults(p)
    // SKU is intentionally not validated — Zid assigns it on import.
    if (!p.nameAr.trim()) hit(missingName, locate(p, i))
    if (!p.price.trim()) hit(missingPrice, locate(p, i))
    // Weight/unit have defaults, so this only fires if a default is ever blank.
    if (!d.weight || !d.weightUnit) hit(missingWeight, locate(p, i))

    const axes = validAxes(p)
    // A named option whose values would expand into variants must not carry a
    // selector-like name (e.g. `s-product-options-grid-mode-span`).
    if (axes.some((a) => isSelectorLike(a.nameAr))) hit(selectorOption, locate(p, i))
    // has_variants=Yes (≥1 axis) must yield ≥1 child row; the serializer
    // guarantees this, so the check is a structural safety net.
    if (axes.length > 0 && combinations(axes).length === 0) hit(orphanParent, locate(p, i))

    if (missingEnglish(p)) hit(noEnglish, locate(p, i))
    if (hasUnnamedOption(p)) hit(unnamedOption, locate(p, i))
  })

  const errors = [
    toIssue('zidName', 'منتجات بدون اسم عربي (name_ar مطلوب)', missingName),
    toIssue('zidPrice', 'منتجات بدون سعر (price مطلوب)', missingPrice),
    toIssue('zidWeight', 'منتجات بدون وزن (weight/weight_unit مطلوب)', missingWeight),
    toIssue('zidSelectorOption', 'أسماء خيارات غير صالحة (تبدو كمُحدِّد CSS)', selectorOption),
    toIssue('zidOrphanParent', 'منتج بخيارات بدون منتجات فرعية', orphanParent),
  ].filter((x): x is Issue => x !== null)

  const warnings = [
    toIssue('zidUnnamedOption', 'خيارات بدون اسم — تم تجاهلها', unnamedOption),
    toIssue('zidMissingEn', 'حقول عربية بدون مقابل إنجليزي', noEnglish),
  ].filter((x): x is Issue => x !== null)

  return { errors, warnings, ok: errors.length === 0 }
}

export const zidAdapter: ExportAdapter = {
  id: 'zid',
  fileName: 'zid-import.xlsx',
  serialize,
  validate,
}
