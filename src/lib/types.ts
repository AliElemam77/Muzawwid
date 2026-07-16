import type { OptionType } from './salla'

/** How a single Salla field gets its value. */
export type FieldSource =
  | { kind: 'none' }
  | { kind: 'column'; column: string }
  | { kind: 'constant'; value: string }

/** SKU generation strategy. */
export type SkuConfig =
  | { mode: 'none' }
  | { mode: 'column'; column: string }
  | { mode: 'regex'; column: string; prefix: string } // extract /p(\d+)
  | { mode: 'auto'; prefix: string } // auto-increment

/**
 * Fixed quantity applied to EVERY product/variant row.
 * - `source`: keep whatever the source provides (today that is empty).
 * - `infinite`: write the literal `infinite`.
 * - `fixed`: write `value` on every row.
 */
export interface QuantityConfig {
  mode: 'source' | 'infinite' | 'fixed'
  value: string
}

/** A price field that can be a rule's target or source. */
export type PriceField = 'price' | 'salePrice' | 'cost'

/** Arithmetic relating one price field to another. */
export type PriceOp = 'percentOff' | 'percentOf' | 'multiply' | 'add' | 'subtract'

/**
 * One derivation, e.g. `salePrice = price − 10%` → { target:'salePrice',
 * source:'price', op:'percentOff', value:'10' }. Rules run in order, so a later
 * rule can read a value an earlier rule wrote.
 */
export interface PriceRule {
  target: PriceField
  source: PriceField
  op: PriceOp
  value: string
}

/** One source column marked as a product option (variant axis). */
export interface OptionColumn {
  column: string // source column holding the option value(s)
  name: string // display name, e.g. المقاس / اللون
  type: OptionType // نص | لون | صورة
  swatchColumn?: string // optional source column with hex/color per value
  /**
   * Read the option's display name from THIS source column instead of typing a
   * fixed `name` — for sheets where the axis label differs per product (one row
   * says «المقاس», the next «الحجم»). `name` stays as the fallback for rows
   * where this column is empty.
   */
  nameColumn?: string
}

/** Where العنوان الترويجي falls back to when the mapped value is empty. */
export type PromoFallback = 'none' | 'name' | 'description'

/**
 * Salla rejects an العنوان الترويجي longer than 25 characters, so by default we
 * clamp it and — when nothing is mapped — derive it from the product name.
 */
export interface PromoTitleConfig {
  /** Cut any promo title down to 25 characters (Salla's hard limit). */
  truncate: boolean
  /** Field to derive the promo title from when the mapped value is empty. */
  fallback: PromoFallback
}

/** Editable constant defaults, applied to EVERY row when the target is empty. */
export interface Defaults {
  productType: string
  requiresShipping: string
  taxable: string
  weight: string
  weightUnit: string
  maxQtyPerCustomer: string
}

/** The complete, serializable mapping configuration (savable as a preset). */
export interface MappingConfig {
  /** Simple per-field mappings keyed by Salla header. */
  fields: Record<string, FieldSource>
  /** Source columns merged (dedup, comma-joined) into صورة المنتج. */
  imageColumns: string[]
  sku: SkuConfig
  options: OptionColumn[] // up to 3
  defaults: Defaults
  /** Fixed/infinite quantity applied to every row (adapter platforms). */
  quantity: QuantityConfig
  /** Ordered price derivations (sale_price / cost / price). */
  priceRules: PriceRule[]
  /** Clamp/auto-fill behaviour for العنوان الترويجي. */
  promoTitle: PromoTitleConfig
}

export const DEFAULT_PROMO_TITLE: PromoTitleConfig = {
  truncate: true,
  fallback: 'name',
}

export const DEFAULT_DEFAULTS: Defaults = {
  productType: 'منتج جاهز',
  requiresShipping: 'نعم',
  taxable: 'نعم',
  weight: '1',
  weightUnit: 'kg',
  // Salla rejects an empty/0 "اقصي كمية لكل عميل" (must be >= 1). A high default
  // means "no practical limit per customer"; the user can lower it if they want a cap.
  maxQtyPerCustomer: '10000',
}

export function emptyConfig(): MappingConfig {
  return {
    fields: {},
    imageColumns: [],
    sku: { mode: 'none' },
    options: [],
    defaults: { ...DEFAULT_DEFAULTS },
    quantity: { mode: 'source', value: '' },
    priceRules: [],
    promoTitle: { ...DEFAULT_PROMO_TITLE },
  }
}

/** A saved preset. */
export interface Preset {
  name: string
  config: MappingConfig
}
