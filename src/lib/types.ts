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

/** One source column marked as a product option (variant axis). */
export interface OptionColumn {
  column: string // source column holding the option value(s)
  name: string // display name, e.g. المقاس / اللون
  type: OptionType // نص | لون | صورة
  swatchColumn?: string // optional source column with hex/color per value
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
  }
}

/** A saved preset. */
export interface Preset {
  name: string
  config: MappingConfig
}
