/**
 * Salla keeps stock OUT of the product-import template — there is no quantity
 * column there, only «اقصي كمية لكل عميل». Stock lives in a second file, the
 * «Salla Product Quantities Sheet», which the merchant otherwise fills in by
 * hand one row per variant.
 *
 * These are the types shared by the whole quantities feature. They deliberately
 * mirror the exported file's six columns one-to-one, so a `QuantityRow` can be
 * written out, read back, and compared without any intermediate shape.
 */

/** One variant axis — «اللون» with «أحمر, أزرق», «المقاس» with «40, 42», … */
export interface OptionGroup {
  id: string
  name: string
  values: string[]
}

/** Column B: a parent product row, or one of its variant rows. */
export const ROW_PRODUCT = 'منتج'
export const ROW_OPTION = 'خيار'
export type QuantityRowType = typeof ROW_PRODUCT | typeof ROW_OPTION

/** «غير محدود الكمية» — the switch that decides whether a row has a number. */
export const UNLIMITED = 'نعم'
export const LIMITED = 'لا'
export type Unlimited = typeof UNLIMITED | typeof LIMITED

/**
 * One row of the quantities sheet.
 *
 * `no` is Salla's own internal id (e.g. `1805954759`), assigned when the
 * product is created in the store — never something we can invent. It is
 * `''` in generate mode and carried through verbatim in merge mode, and it is
 * a STRING so a 10-digit id cannot lose precision on a round trip.
 */
export interface QuantityRow {
  no: string
  type: QuantityRowType
  name: string
  sku: string
  /** Editable on EVERY row — products and variants alike. */
  unlimited: Unlimited
  /** Follows `unlimited`: a number when لا, blank when نعم. */
  quantity: number | ''
}

/**
 * The feature's single rule, in one place so nothing can drift from it:
 *
 *   غير محدود الكمية = نعم  ⇒  الكمية فاضية
 *   غير محدود الكمية = لا   ⇒  الكمية رقم (وصفر لو مفيش)
 *
 * Every path that builds, reads, merges or edits a row runs through here.
 */
export function applyStockRule(row: QuantityRow): QuantityRow {
  if (row.unlimited === UNLIMITED) {
    return row.quantity === '' ? row : { ...row, quantity: '' }
  }
  return row.quantity === '' ? { ...row, quantity: 0 } : row
}

/** The minimum a product must offer to become quantity rows. */
export interface QuantityProduct {
  /** Salla's id when we know it; blank in generate mode. */
  no?: string
  name: string
  sku?: string
}

export interface GenerateConfig {
  groups: OptionGroup[]
  /** Starting value of «غير محدود الكمية» on every generated row. */
  defaultUnlimited: Unlimited
  /** Quantity written when the row is limited. */
  defaultQuantity: number
}

/** What merging a merchant's sheet into Salla's export did — and did not — do. */
export interface MergeReport {
  /** Salla rows that took a new quantity. */
  matched: number
  /**
   * Salla rows nothing matched. They are kept EXACTLY as they were: dropping
   * or blanking them would wipe stock the merchant already has.
   */
  unmatched: QuantityRow[]
  /**
   * Names from the merchant's sheet with no row in Salla's export — products
   * that do not exist in the store yet, so they cannot be given a quantity.
   */
  missingInStore: string[]
}
