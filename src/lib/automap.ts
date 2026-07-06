import { F } from './salla'
import { emptyConfig, type MappingConfig } from './types'

/** Normalize a header for loose matching (lowercase, strip punctuation/diacritics). */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, '') // Arabic diacritics
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
const OPTION_KEYS = ['s product options grid mode span', 'size', 'مقاس', 'المقاس', 'اللون', 'لون', 'color', 'variant', 'option', 'خيار']

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

function looksLikeOption(header: string): boolean {
  const h = norm(header)
  return OPTION_KEYS.some((k) => h.includes(norm(k)))
}

/** Guess an option display name + type from a header. */
function guessOption(header: string): { name: string; type: 'text' | 'color' } {
  const h = norm(header)
  const isColor = ['color', 'لون', 'اللون'].some((k) => h.includes(norm(k)))
  const isSize = ['size', 'مقاس', 'المقاس'].some((k) => h.includes(norm(k)))
  return {
    name: isColor ? 'اللون' : isSize ? 'المقاس' : header,
    type: isColor ? 'color' : 'text',
  }
}

/**
 * Produce an initial MappingConfig by fuzzy-matching source headers.
 * Everything remains editable in the UI.
 */
export function autoMap(headers: string[]): MappingConfig {
  const config = emptyConfig()
  const usedForField = new Set<string>()

  // Images first (multi-select merge).
  const imageCols = headers.filter(looksLikeImage)
  config.imageColumns = imageCols

  // Options (up to 3), excluding anything already claimed as an image.
  const optionCols = headers.filter((h) => looksLikeOption(h) && !imageCols.includes(h)).slice(0, 3)
  config.options = optionCols.map((column) => {
    const g = guessOption(column)
    return { column, name: g.name, type: g.type }
  })

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
