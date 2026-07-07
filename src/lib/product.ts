import { F } from './salla'
import { cleanPrice, splitValues, cleanOptionValues, type RowOverrides } from './build'
import { seoTitle, metaDescription, keywords as buildKeywords } from './generate'
import type { SourceSheet, SourceRow } from './reader'
import type { MappingConfig, SkuConfig } from './types'

/** One product option axis (variant), inline (not expanded into rows). */
export interface ProductOption {
  nameAr: string
  nameEn: string
  values: string[]
}

/**
 * True when a string looks like a raw scrape/CSS selector rather than a human
 * option name (e.g. `s-product-options-grid-mode-span`). Such strings must
 * never reach an export sheet as an option name — the mapping layer rewrites
 * them and the adapters' `validate` blocks any that slip through.
 */
const SELECTOR_WORDS = ['span', 'grid', 'mode', 'product-options', 'div', 'class']
export function isSelectorLike(name: string): boolean {
  const n = name.trim().toLowerCase()
  if (!n) return false
  return n.includes('-') && SELECTOR_WORDS.some((w) => n.includes(w))
}

/** Sanitize a configured option name so a selector string never leaks through. */
export function cleanOptionName(name: string): string {
  return isSelectorLike(name) ? 'الخيار' : name.trim()
}

/**
 * Platform-neutral product. Each export adapter (Salla, Zid, …) serializes
 * this canonical shape into its own spreadsheet — no adapter reads another's
 * format. Fields are strings as read from the source; adapters apply their own
 * defaults and boolean encodings.
 */
export interface Product {
  sku: string
  nameAr: string
  nameEn: string
  brand: string
  weight: string
  weightUnit: string
  price: string
  salePrice: string
  cost: string
  quantity: string
  /** Category paths (levels joined by '>', paths by ',') — Arabic + English. */
  categoriesAr: string
  categoriesEn: string
  images: string[]
  imagesAlt: string
  /** Product page URL (some scrapes put it as the first "image" cell). */
  productPageUrl: string
  descriptionAr: string
  descriptionEn: string
  shortDescAr: string
  shortDescEn: string
  /** SEO — deterministically generated from the name (editable/AI-overridable). */
  seoTitleAr: string
  seoTitleEn: string
  metaDescAr: string
  metaDescEn: string
  keywords: string
  barcode: string
  /** Undefined means "not specified" — adapters apply their own default. */
  published?: boolean
  vatFree?: boolean
  shippingRequired?: boolean
  options: ProductOption[]
}

/* ------------------------------- resolution ------------------------------ */

function resolve(row: SourceRow, config: MappingConfig, header: string): string {
  const src = config.fields[header]
  if (!src || src.kind === 'none') return ''
  if (src.kind === 'constant') return src.value ?? ''
  return row[src.column] ?? ''
}

function mergeImages(row: SourceRow, columns: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const col of columns) {
    for (const u of splitValues(row[col] ?? '')) {
      if (!seen.has(u)) {
        seen.add(u)
        out.push(u)
      }
    }
  }
  return out
}

/** A URL pointing at an actual image file (by extension). */
const IMAGE_URL_RE =
  /\.(jpe?g|jfif|pjpeg|pjp|png|apng|webp|gif)(\?|#|$)/i

/**
 * Some scrapes put the product's page URL as the FIRST "image" cell, followed
 * by the real image URLs. Split that leading non-image link out into its own
 * field so it doesn't pollute the images column. Only the first entry is
 * inspected, and only when it clearly isn't an image file.
 */
function splitPageUrl(images: string[]): { pageUrl: string; images: string[] } {
  if (images.length > 1 && !IMAGE_URL_RE.test(images[0])) {
    return { pageUrl: images[0], images: images.slice(1) }
  }
  return { pageUrl: '', images }
}

function productSku(row: SourceRow, config: MappingConfig, index: number): string {
  const sku: SkuConfig = config.sku
  switch (sku.mode) {
    case 'column':
      return (row[sku.column] ?? '').trim()
    case 'regex': {
      const m = /\/p(\d+)/.exec(row[sku.column] ?? '')
      return m ? `${sku.prefix}${m[1]}` : ''
    }
    case 'auto':
      return `${sku.prefix}${index + 1}`
    default:
      return resolve(row, config, F.sku).trim()
  }
}

/** A canonical product plus the source row index it came from (for inline editing). */
export type SourcedProduct = Product & { sourceIndex: number }

/**
 * Build canonical products from the shared mapping config. One product per
 * non-empty, non-excluded source row (variants stay inline via `options`).
 * Each product carries its `sourceIndex` so the UI can edit specific rows.
 */
export function buildProducts(
  source: SourceSheet,
  config: MappingConfig,
  rowOverrides: RowOverrides = {},
  excludedRows: ReadonlySet<number> = new Set(),
): SourcedProduct[] {
  const products: SourcedProduct[] = []

  source.rows.forEach((row, index) => {
    if (Object.values(row).every((v) => !v)) return
    if (excludedRows.has(index)) return

    const override = rowOverrides[index] ?? {}
    const pick = (header: string) =>
      header in override ? override[header] : resolve(row, config, header)

    const rawImages =
      config.imageColumns.length > 0
        ? mergeImages(row, config.imageColumns)
        : splitValues(resolve(row, config, F.image))
    const { pageUrl, images } = splitPageUrl(rawImages)

    const options: ProductOption[] = config.options
      .filter((o) => o.column)
      .slice(0, 3)
      .map((o) => ({
        nameAr: cleanOptionName(o.name),
        nameEn: '',
        values: cleanOptionValues(row[o.column] ?? ''),
      }))
      .filter((o) => o.values.length > 0)

    const nameAr = pick(F.name)
    const categoriesAr = pick(F.category)
    const brand = resolve(row, config, F.brand)

    products.push({
      sourceIndex: index,
      sku: productSku(row, config, index),
      nameAr,
      nameEn: '',
      brand,
      weight: resolve(row, config, F.weight),
      weightUnit: config.defaults.weightUnit || '',
      price: cleanPrice(pick(F.price)),
      salePrice: cleanPrice(resolve(row, config, F.discountPrice)),
      cost: cleanPrice(resolve(row, config, F.cost)),
      quantity: '',
      categoriesAr,
      categoriesEn: '',
      images,
      imagesAlt: resolve(row, config, F.imageAlt),
      productPageUrl: pageUrl,
      descriptionAr: resolve(row, config, F.description),
      descriptionEn: '',
      shortDescAr: '',
      shortDescEn: '',
      // SEO auto-generated from the Arabic name (English SEO left blank unless
      // an English name exists, so we never dump Arabic into the _en fields).
      seoTitleAr: seoTitle(nameAr),
      seoTitleEn: '',
      metaDescAr: metaDescription(nameAr, categoriesAr, brand),
      metaDescEn: '',
      keywords: buildKeywords(nameAr, brand, categoriesAr),
      barcode: resolve(row, config, F.barcode),
      options,
    })
  })

  return products
}
