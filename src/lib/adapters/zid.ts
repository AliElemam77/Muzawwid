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

// SKU is intentionally NOT generated here — Zid assigns product/sub-product
// SKUs itself. Whatever the source mapping provides (often empty) is passed
// through untouched.

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
    name_en: p.nameEn,
    weight_unit: d.weightUnit,
    weight: d.weight,
    price: p.price,
    sale_price: p.salePrice,
    cost: p.cost,
    quantity: p.quantity,
    categories_ar: p.categoriesAr,
    // Mirror the Arabic categories when the English side is missing.
    categories_en: p.categoriesEn || p.categoriesAr,
    published: yn(d.published),
    images: p.images.join(','),
    images_alt_text: p.imagesAlt,
    product_page_url: toSlug(p.productPageUrl),
    vat_free: yn(d.vatFree),
    shipping_required: yn(d.shippingRequired),
    barcode: p.barcode,
    keywords: p.keywords,
    description_ar: p.descriptionAr,
    description_en: p.descriptionEn,
    short_description_ar: p.shortDescAr,
    short_description_en: p.shortDescEn,
    product_page_title_ar: p.seoTitleAr,
    product_page_title_en: p.seoTitleEn,
    product_page_description_ar: p.metaDescAr,
    product_page_description_en: p.metaDescEn,
  }
}

const toRow = (rec: Record<string, string>) => ZID_HEADERS.map((k) => rec[k] ?? '')

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
  const aoa: string[][] = []
  aoa.push(zidGroupRow()) // row 1
  aoa.push([...ZID_HEADERS]) // row 2

  for (const p of products) {
    const axes = validAxes(p)

    if (axes.length === 0) {
      const rec = baseRecord(p)
      rec.has_variants = 'No'
      aoa.push(toRow(rec))
      continue
    }

    // Parent: names only, values empty.
    const parent = baseRecord(p)
    parent.has_variants = 'Yes'
    axes.forEach((a, i) => {
      parent[`option${i + 1}_name_ar`] = a.nameAr
      parent[`option${i + 1}_name_en`] = a.nameEn
    })
    aoa.push(toRow(parent))

    // One child per combination: values only, names/main fields empty.
    for (const combo of combinations(axes)) {
      const child: Record<string, string> = {}
      combo.forEach((v, i) => {
        child[`option${i + 1}_value_ar`] = v
        child[`option${i + 1}_value_en`] = ''
      })
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
