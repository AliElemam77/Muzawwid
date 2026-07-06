import * as XLSX from 'xlsx'

/**
 * Salla Products Template — EXACT schema.
 * Do not change names, order, or the trailing space in the first header.
 */

export const SHEET_NAME = 'Salla Products Template Sheet'
export const SECTION_LABEL = 'بيانات المنتج'

/** The 40 header columns, in the exact order Salla requires. */
export const SALLA_HEADERS = [
  'النوع ', // <-- trailing space is intentional and required
  'أسم المنتج',
  'تصنيف المنتج',
  'صورة المنتج',
  'وصف صورة المنتج',
  'نوع المنتج',
  'سعر المنتج',
  'الوصف',
  'هل يتطلب شحن؟',
  'رمز المنتج sku',
  'سعر التكلفة',
  'السعر المخفض',
  'تاريخ بداية التخفيض',
  'تاريخ نهاية التخفيض',
  'اقصي كمية لكل عميل',
  'إخفاء خيار تحديد الكمية',
  'اضافة صورة عند الطلب',
  'الوزن',
  'وحدة الوزن',
  'الماركة',
  'العنوان الترويجي',
  'تثبيت المنتج',
  'الباركود',
  'السعرات الحرارية',
  'MPN',
  'GTIN',
  'خاضع للضريبة ؟',
  'سبب عدم الخضوع للضريبة',
  '[1] الاسم',
  '[1] النوع',
  '[1] القيمة',
  '[1] الصورة / اللون',
  '[2] الاسم',
  '[2] النوع',
  '[2] القيمة',
  '[2] الصورة / اللون',
  '[3] الاسم',
  '[3] النوع',
  '[3] القيمة',
  '[3] الصورة / اللون',
] as const

export type SallaHeader = (typeof SALLA_HEADERS)[number]

/** Convenience: fields we reference by name in the builder. */
export const F = {
  type: 'النوع ',
  name: 'أسم المنتج',
  category: 'تصنيف المنتج',
  image: 'صورة المنتج',
  imageAlt: 'وصف صورة المنتج',
  productType: 'نوع المنتج',
  price: 'سعر المنتج',
  description: 'الوصف',
  requiresShipping: 'هل يتطلب شحن؟',
  sku: 'رمز المنتج sku',
  cost: 'سعر التكلفة',
  discountPrice: 'السعر المخفض',
  discountStart: 'تاريخ بداية التخفيض',
  discountEnd: 'تاريخ نهاية التخفيض',
  maxQty: 'اقصي كمية لكل عميل',
  hideQty: 'إخفاء خيار تحديد الكمية',
  imageOnOrder: 'اضافة صورة عند الطلب',
  weight: 'الوزن',
  weightUnit: 'وحدة الوزن',
  brand: 'الماركة',
  promoTitle: 'العنوان الترويجي',
  pin: 'تثبيت المنتج',
  barcode: 'الباركود',
  calories: 'السعرات الحرارية',
  mpn: 'MPN',
  gtin: 'GTIN',
  taxable: 'خاضع للضريبة ؟',
  taxExemptReason: 'سبب عدم الخضوع للضريبة',
} as const

/** Row-kind markers used in the first column. */
export const ROW_PRODUCT = 'منتج'
export const ROW_OPTION = 'خيار'

/** Placeholder that must sit in `[n] القيمة` on the PARENT row. */
export const OPTION_VALUE_PLACEHOLDER =
  'نص توضيحي فقط: ممنوع الكتابة في هذا الحقل في صف المنتج بتاتًا'

/** Option-type labels for `[n] النوع`. */
export const OPTION_TYPES = {
  text: 'نص',
  color: 'لون',
  image: 'صورة',
} as const
export type OptionType = keyof typeof OPTION_TYPES

/** The three repeating option-group column names, indexed 1..3. */
export function optionGroupCols(n: 1 | 2 | 3) {
  return {
    name: `[${n}] الاسم`,
    type: `[${n}] النوع`,
    value: `[${n}] القيمة`,
    swatch: `[${n}] الصورة / اللون`,
  }
}

/** A single output row keyed by Salla header. Missing keys => empty cell. */
export type SallaRow = Partial<Record<string, string>>

/**
 * Build the SheetJS workbook for Salla import.
 * Layout:
 *   AOA[0] = [SECTION_LABEL]      (row 1: label, only A1)
 *   AOA[1] = SALLA_HEADERS        (row 2: 40 headers)
 *   AOA[2..] = product/option data
 * Guarantees exactly ONE sheet named SHEET_NAME.
 */
export function buildSallaWorkbook(rows: SallaRow[]): XLSX.WorkBook {
  const aoa: (string | number)[][] = []
  aoa.push([SECTION_LABEL]) // row 1
  aoa.push([...SALLA_HEADERS]) // row 2
  for (const row of rows) {
    aoa.push(SALLA_HEADERS.map((h) => row[h] ?? '')) // row 3+
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME)

  // Defensive: ensure only our single sheet exists.
  wb.SheetNames = [SHEET_NAME]
  wb.Sheets = { [SHEET_NAME]: ws }

  return wb
}

/** Serialize the workbook to an .xlsx Blob for download. */
export function workbookToBlob(wb: XLSX.WorkBook): Blob {
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export function downloadWorkbook(wb: XLSX.WorkBook, filename = 'salla-import.xlsx') {
  const blob = workbookToBlob(wb)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
