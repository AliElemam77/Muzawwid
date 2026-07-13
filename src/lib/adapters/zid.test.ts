import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import {
  serialize,
  validate,
  toSlug,
  toEnglishValue,
  toEnglishText,
  toEnglishOptionName,
  normalizeWeightUnit,
  toNumber,
  toQuantity,
  normalizeBoolean,
  dedupeImages,
  formatDescription,
  slugify,
  ZID_HEADERS,
  ZID_SHEET_NAME,
  ZID_COLUMN_COUNT,
} from './zid'
import type { Product } from '../product'

function product(overrides: Partial<Product> = {}): Product {
  return {
    sku: 'SKU-1',
    nameAr: 'قميص',
    nameEn: '',
    brand: '',
    weight: '',
    weightUnit: '',
    price: '100',
    salePrice: '',
    cost: '',
    quantity: '',
    categoriesAr: 'ملابس>رجالي',
    categoriesEn: '',
    images: ['a.jpg', 'b.jpg'],
    imagesAlt: '',
    productPageUrl: '',
    descriptionAr: '',
    descriptionEn: '',
    shortDescAr: '',
    shortDescEn: '',
    seoTitleAr: '',
    seoTitleEn: '',
    metaDescAr: '',
    metaDescEn: '',
    keywords: '',
    barcode: '',
    options: [],
    ...overrides,
  }
}

/** Read the serialized workbook back as an array-of-arrays (numbers stay numeric). */
function aoaOf(products: Product[]): (string | number)[][] {
  const wb = serialize(products)
  const ws = wb.Sheets[ZID_SHEET_NAME]
  return XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: '' })
}

const col = (key: string) => ZID_HEADERS.indexOf(key)

describe('Zid adapter — structural invariants', () => {
  it('has exactly 111 machine keys in row 2', () => {
    expect(ZID_HEADERS).toHaveLength(ZID_COLUMN_COUNT)
    expect(ZID_HEADERS[0]).toBe('sku')
    expect(ZID_HEADERS[ZID_HEADERS.length - 1]).toBe('filtration_type_2')
  })

  it('produces a single sheet named Sheet1', () => {
    const wb = serialize([product()])
    expect(wb.SheetNames).toEqual([ZID_SHEET_NAME])
    expect(Object.keys(wb.Sheets)).toEqual([ZID_SHEET_NAME])
  })

  it('places the 6 group labels at the right 1-based columns in row 1', () => {
    const aoa = aoaOf([product()])
    const row1 = aoa[0]
    expect(row1[1]).toBe('المعلومات الأساسية - General Details') // col 2
    expect(row1[22]).toBe('وصف المنتج - Product Description') // col 23
    expect(row1[27]).toBe('تحسينات محركات البحث  - SEO Enhanamcent') // col 28
    expect(row1[32]).toBe('خيارات المنتج (غير أساسية) - Products Options') // col 33
    expect(row1[45]).toBe('إضافات المنتج (غير أساسية) - Product Additions') // col 46
    expect(row1[97]).toBe('Product Filtration - (غير أساسية) معايير التصفية') // col 98
    // every other column in row 1 is blank
    const labelled = new Set([1, 22, 27, 32, 45, 97])
    row1.forEach((v, i) => {
      if (!labelled.has(i)) expect(v).toBe('')
    })
  })

  it('row 2 equals the 111 headers exactly', () => {
    const aoa = aoaOf([product()])
    expect(aoa[1]).toEqual([...ZID_HEADERS])
    expect(aoa[1]).toHaveLength(ZID_COLUMN_COUNT)
  })

  it('writes one data row per product, each with a numeric defaulted weight', () => {
    const products = [product({ sku: 'A' }), product({ sku: 'B' }), product({ sku: 'C' })]
    const aoa = aoaOf(products)
    expect(aoa.length).toBe(2 + products.length) // 2 header rows + data
    const w = col('weight')
    for (let r = 2; r < aoa.length; r++) {
      expect(aoa[r][w]).toBe(1) // defaulted to 1, emitted as a Number
    }
  })
})

describe('Zid adapter — field encoding', () => {
  it('applies defaults, Kg weight unit and Yes/No booleans', () => {
    const aoa = aoaOf([product()])
    const row = aoa[2]
    expect(row[col('weight')]).toBe(1)
    expect(row[col('weight_unit')]).toBe('Kg')
    expect(row[col('published')]).toBe('Yes')
    expect(row[col('vat_free')]).toBe('No')
    expect(row[col('shipping_required')]).toBe('Yes')
    expect(row[col('has_variants')]).toBe('No')
  })

  it('joins images and mirrors Arabic categories into the English column', () => {
    const aoa = aoaOf([product()])
    const row = aoa[2]
    expect(row[col('images')]).toBe('a.jpg,b.jpg')
    expect(row[col('categories_ar')]).toBe('ملابس>رجالي')
    expect(row[col('categories_en')]).toBe('ملابس>رجالي')
  })

  it('maps SEO fields into the product_page_* columns', () => {
    const aoa = aoaOf([
      product({ seoTitleAr: 'عباية سوداء', metaDescAr: 'اشترِ عباية سوداء', keywords: 'عباية, سوداء' }),
    ])
    const row = aoa[2]
    expect(row[col('product_page_title_ar')]).toBe('عباية سوداء')
    expect(row[col('product_page_description_ar')]).toBe('اشترِ عباية سوداء')
    expect(row[col('keywords')]).toBe('عباية, سوداء')
  })

  it('writes the product page URL as a slug (letters/numbers/dashes), not into images', () => {
    const aoa = aoaOf([
      product({ productPageUrl: 'https://shop.example/ar/shoe-red/p123?x=1', images: ['a.jpg'] }),
    ])
    const row = aoa[2]
    // full URL is reduced to a valid Zid slug — no scheme/host/query/punctuation
    expect(row[col('product_page_url')]).toBe('ar-shoe-red-p123')
    expect(row[col('images')]).toBe('a.jpg')
  })

  it('does NOT set has_variants for an option that has values but no name', () => {
    const p = product({
      options: [{ nameAr: '', nameEn: '', values: ['S', 'M'] }],
    })
    const row = aoaOf([p])[2]
    expect(row[col('has_variants')]).toBe('No')
    expect(row[col('option1_name_ar')]).toBe('')
    expect(row[col('option1_value_ar')]).toBe('')
    // and it is surfaced as a non-blocking warning
    const v = validate([p])
    expect(v.ok).toBe(true)
    expect(v.warnings.map((w) => w.code)).toContain('zidUnnamedOption')
  })

  it('expands variants into a parent row + one child row per combination', () => {
    const p = product({
      sku: 'SH',
      options: [
        { nameAr: 'المقاس', nameEn: 'Size', values: ['S', 'M', 'L'] },
        { nameAr: 'اللون', nameEn: '', values: ['أحمر', 'أزرق'] },
      ],
    })
    const aoa = aoaOf([p])
    // 2 header rows + 1 parent + (3 × 2) children = 9
    expect(aoa.length).toBe(2 + 1 + 6)

    const parent = aoa[2]
    expect(parent[col('has_variants')]).toBe('Yes')
    expect(parent[col('name_ar')]).toBe('قميص')
    expect(parent[col('sku')]).toBe('SH')
    expect(parent[col('option1_name_ar')]).toBe('المقاس')
    expect(parent[col('option1_name_en')]).toBe('Size')
    expect(parent[col('option2_name_ar')]).toBe('اللون')
    // اللون had no English → filled from the option-name map
    expect(parent[col('option2_name_en')]).toBe('Color')
    // parent option VALUES are empty
    expect(parent[col('option1_value_ar')]).toBe('')
    expect(parent[col('option2_value_ar')]).toBe('')

    // first child: option values + variant SKU + inherited price
    const child = aoa[3]
    expect(child[col('name_ar')]).toBe('')
    expect(child[col('has_variants')]).toBe('')
    expect(child[col('option1_name_ar')]).toBe('')
    expect(child[col('option1_value_ar')]).toBe('S')
    expect(child[col('option1_value_en')]).toBe('S')
    expect(child[col('option2_value_ar')]).toBe('أحمر')
    expect(child[col('option2_value_en')]).toBe('Red')
    // variant SKU = {parent}-{option1 value}; inherits parent price
    expect(child[col('sku')]).toBe('SH-S')
    expect(child[col('price')]).toBe(100)

    // the 6 children cover every S/M/L × أحمر/أزرق combination
    const combos = aoa
      .slice(3)
      .map((r) => `${r[col('option1_value_ar')]}-${r[col('option2_value_ar')]}`)
      .sort()
    expect(combos).toEqual(
      ['S-أحمر', 'S-أزرق', 'M-أحمر', 'M-أزرق', 'L-أحمر', 'L-أزرق'].sort(),
    )
  })

  it('a variant parent is the only row carrying weight; children are blank', () => {
    const p = product({ options: [{ nameAr: 'المقاس', nameEn: '', values: ['S', 'M'] }] })
    const aoa = aoaOf([p])
    const w = col('weight')
    expect(aoa[2][w]).toBe(1) // parent
    expect(aoa[3][w]).toBe('') // child
    expect(aoa[4][w]).toBe('') // child
  })
})

describe('Zid adapter — SKU generation', () => {
  it('generates an uppercase-slug SKU from the name when none is provided', () => {
    const p = product({ sku: '', nameAr: 'قميص', nameEn: 'Cotton Shirt', price: '100' })
    const row = aoaOf([p])[2]
    // English name preferred, slugified to uppercase with hyphens
    expect(row[col('sku')]).toBe('COTTON-SHIRT')
  })

  it('falls back to the Arabic name when there is no English name', () => {
    const row = aoaOf([product({ sku: '', nameAr: 'حزام', price: '80' })])[2]
    expect(row[col('sku')]).toBe('حزام')
  })

  it('enforces uniqueness by appending -2/-3…', () => {
    const aoa = aoaOf([
      product({ sku: 'DUP', nameAr: 'أ' }),
      product({ sku: 'DUP', nameAr: 'ب' }),
      product({ sku: 'DUP', nameAr: 'ج' }),
    ])
    expect(aoa[2][col('sku')]).toBe('DUP')
    expect(aoa[3][col('sku')]).toBe('DUP-2')
    expect(aoa[4][col('sku')]).toBe('DUP-3')
  })

  it('builds variant SKUs as {parent}-{option1} and keeps them unique', () => {
    const p = product({
      sku: 'SH',
      options: [{ nameAr: 'المقاس', nameEn: 'Size', values: ['S', 'M'] }],
    })
    const aoa = aoaOf([p])
    expect(aoa[3][col('sku')]).toBe('SH-S')
    expect(aoa[4][col('sku')]).toBe('SH-M')
  })
})

describe('Zid adapter — English population', () => {
  it('fills name_en / page-title_en only when the source carries Latin text', () => {
    const withLatin = aoaOf([product({ nameAr: 'Nike حذاء', seoTitleAr: 'Nike Shoe' })])[2]
    expect(withLatin[col('name_en')]).toBe('Nike حذاء')
    expect(withLatin[col('product_page_title_en')]).toBe('Nike Shoe')

    const arabicOnly = aoaOf([product({ nameAr: 'حذاء رياضي', seoTitleAr: 'حذاء' })])[2]
    expect(arabicOnly[col('name_en')]).toBe('')
    expect(arabicOnly[col('product_page_title_en')]).toBe('')
  })

  it('maps sizes and colors on variant value_en columns', () => {
    const p = product({
      sku: 'P',
      options: [
        { nameAr: 'المقاس', nameEn: '', values: ['كبير'] },
        { nameAr: 'اللون', nameEn: '', values: ['أحمر'] },
      ],
    })
    const child = aoaOf([p])[3]
    expect(child[col('option1_value_en')]).toBe('L') // كبير → L
    expect(child[col('option2_value_en')]).toBe('Red') // أحمر → Red
  })

  it('helpers: value / text / option-name English', () => {
    expect(toEnglishValue('XL')).toBe('XL')
    expect(toEnglishValue('متوسط')).toBe('M')
    expect(toEnglishValue('أزرق')).toBe('Blue')
    expect(toEnglishValue('قطن')).toBe('') // no mapping, no Latin
    expect(toEnglishText('حذاء', '')).toBe('') // Arabic only
    expect(toEnglishText('Shoe حذاء', '')).toBe('Shoe حذاء') // Latin present
    expect(toEnglishText('حذاء', 'Shoe')).toBe('Shoe') // keeps existing English
    expect(toEnglishOptionName('اللون', '')).toBe('Color')
    expect(toEnglishOptionName('المقاس', '')).toBe('Size')
  })
})

describe('Zid adapter — value normalization', () => {
  it('normalizes weight units to exactly Kg / g', () => {
    expect(normalizeWeightUnit('kg')).toBe('Kg')
    expect(normalizeWeightUnit('KG')).toBe('Kg')
    expect(normalizeWeightUnit('كيلو')).toBe('Kg')
    expect(normalizeWeightUnit('')).toBe('Kg') // default
    expect(normalizeWeightUnit('g')).toBe('g')
    expect(normalizeWeightUnit('جرام')).toBe('g')
    expect(normalizeWeightUnit('GRAMS')).toBe('g')
    expect(aoaOf([product({ weightUnit: 'grams' })])[2][col('weight_unit')]).toBe('g')
  })

  it('coerces numeric fields to real Numbers', () => {
    const p = product({ weight: '2.5', price: '1,200', salePrice: '999', cost: '40' })
    const row = aoaOf([p])[2]
    expect(row[col('weight')]).toBe(2.5)
    expect(typeof row[col('price')]).toBe('number')
    expect(row[col('price')]).toBe(1200) // thousands separator stripped
    expect(row[col('sale_price')]).toBe(999)
    expect(row[col('cost')]).toBe(40)
    expect(toNumber('')).toBe('') // empty stays empty (not 0)
  })

  it('coerces quantity to an integer unless it is infinite', () => {
    expect(aoaOf([product({ quantity: '5.9' })])[2][col('quantity')]).toBe(5)
    expect(aoaOf([product({ quantity: 'infinite' })])[2][col('quantity')]).toBe('infinite')
    expect(toQuantity('')).toBe('')
    expect(toQuantity('12')).toBe(12)
  })

  it('normalizes booleans to Yes / No; empty stays empty', () => {
    expect(normalizeBoolean('TRUE')).toBe('Yes')
    expect(normalizeBoolean('1')).toBe('Yes')
    expect(normalizeBoolean('نعم')).toBe('Yes')
    expect(normalizeBoolean('false')).toBe('No')
    expect(normalizeBoolean('0')).toBe('No')
    expect(normalizeBoolean('')).toBe('')
  })
})

describe('Zid adapter — image dedup & description formatting', () => {
  it('dedupes images ignoring query params and keeps the widest', () => {
    expect(
      dedupeImages([
        'https://cdn/x.jpg?v=1&width=100',
        'https://cdn/x.jpg?width=800',
        'https://cdn/y.jpg',
        'https://cdn/y.jpg?width=50',
      ]),
      // a bare URL counts as width 0, so the ?width=50 variant wins
    ).toEqual(['https://cdn/x.jpg?width=800', 'https://cdn/y.jpg?width=50'])

    const row = aoaOf([
      product({ images: ['p.jpg?width=200', 'p.jpg?width=1000'] }),
    ])[2]
    expect(row[col('images')]).toBe('p.jpg?width=1000')
  })

  it('unescapes literal \\n but leaves HTML untouched', () => {
    expect(formatDescription('سطر1\\nسطر2')).toBe('سطر1\nسطر2')
    expect(formatDescription('<p>مرحبا</p>')).toBe('<p>مرحبا</p>')
    const row = aoaOf([product({ descriptionAr: 'أول\\nثاني' })])[2]
    expect(row[col('description_ar')]).toBe('أول\nثاني')
  })
})

describe('slugify', () => {
  it('uppercases and hyphenates, keeping Arabic letters', () => {
    expect(slugify('Cotton Shirt!')).toBe('COTTON-SHIRT')
    expect(slugify('  a__b--c ')).toBe('A-B-C')
    expect(slugify('حذاء رياضي')).toBe('حذاء-رياضي')
  })
})

describe('toSlug — Zid product_page_url', () => {
  it('reduces a full URL to a dash slug', () => {
    expect(toSlug('https://shop.example/ar/shoe-red/p123?ref=x#top')).toBe('ar-shoe-red-p123')
  })
  it('decodes percent-encoded (Arabic) path segments', () => {
    // /منتج-حذاء
    expect(toSlug('https://shop.example/%D9%85%D9%86%D8%AC-%D8%AD%D8%B0%D8%A7%D8%A1')).toBe(
      'منج-حذاء',
    )
  })
  it('keeps an already-valid slug and empties blank input', () => {
    expect(toSlug('classic-shoe-42')).toBe('classic-shoe-42')
    expect(toSlug('')).toBe('')
    expect(toSlug('   ')).toBe('')
  })
})

describe('Zid adapter — end-to-end sample (sizes + plain product)', () => {
  it('expands one sized product + one plain product exactly as Zid expects', () => {
    const sized = product({
      sku: '',
      nameAr: 'حذاء',
      price: '200',
      options: [{ nameAr: 'المقاس', nameEn: 'Size', values: ['52', '54', '58'] }],
    })
    const plain = product({ sku: '', nameAr: 'حزام', price: '80', options: [] })
    const aoa = aoaOf([sized, plain])

    // 2 header rows + (1 parent + 3 children) + 1 plain = 7 rows, 111 cols each
    expect(aoa.length).toBe(2 + 4 + 1)
    aoa.forEach((r) => expect(r).toHaveLength(ZID_COLUMN_COUNT))

    // sized parent — SKU generated from the Arabic name
    const parent = aoa[2]
    expect(parent[col('has_variants')]).toBe('Yes')
    expect(parent[col('sku')]).toBe('حذاء')
    expect(parent[col('option1_name_ar')]).toBe('المقاس')
    expect(parent[col('option1_value_ar')]).toBe('') // no value on parent
    expect(parent[col('option2_name_ar')]).toBe('') // one dimension only

    // three children: value cell + variant SKU + inherited price
    const sizes = ['52', '54', '58']
    sizes.forEach((size, k) => {
      const child = aoa[3 + k]
      expect(child[col('option1_value_ar')]).toBe(size)
      expect(child[col('sku')]).toBe(`حذاء-${size}`)
      expect(child[col('price')]).toBe(200)
      expect(child[col('name_ar')]).toBe('')
      expect(child[col('has_variants')]).toBe('')
      expect(child[col('option1_name_ar')]).toBe('')
      expect(child[col('weight')]).toBe('')
    })

    // plain product → single row, has_variants=No, SKU from the name
    const plainRow = aoa[6]
    expect(plainRow[col('has_variants')]).toBe('No')
    expect(plainRow[col('name_ar')]).toBe('حزام')
    expect(plainRow[col('sku')]).toBe('حزام')

    // validation passes on this sample
    expect(validate([sized, plain]).ok).toBe(true)
  })
})

describe('Zid adapter — validate', () => {
  it('blocks on missing name_ar / price; never on weight (defaulted)', () => {
    const v = validate([product({ sku: '', nameAr: '', price: '' })])
    expect(v.ok).toBe(false)
    const codes = v.errors.map((e) => e.code)
    expect(codes).toContain('zidName')
    expect(codes).toContain('zidPrice')
    expect(codes).not.toContain('zidWeight')
  })

  it('generates a unique SKU from the name and never flags it as an error', () => {
    const p = product({ sku: '', nameAr: 'قميص', nameEn: 'Shirt', price: '100' })
    const v = validate([p])
    expect(v.ok).toBe(true)
    expect(v.errors.map((e) => e.code)).not.toContain('zidSku')
    // the emitted row now carries a generated SKU (slug of the English name)
    const row = aoaOf([p])[2]
    expect(row[col('sku')]).toBe('SHIRT')
  })

  it('blocks on a selector-like option name', () => {
    const p = product({
      options: [
        { nameAr: 's-product-options-grid-mode-span', nameEn: '', values: ['52', '54'] },
      ],
    })
    const v = validate([p])
    expect(v.ok).toBe(false)
    expect(v.errors.map((e) => e.code)).toContain('zidSelectorOption')
  })

  it('warns (does not block) on an Arabic field lacking its English pair', () => {
    const v = validate([product()]) // nameAr set, nameEn empty
    expect(v.ok).toBe(true)
    expect(v.warnings.some((w) => w.code === 'zidMissingEn')).toBe(true)
  })
})
