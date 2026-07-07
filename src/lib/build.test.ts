import { describe, it, expect } from 'vitest'
import { buildRows, validate, cleanPrice, cleanMaxQty, splitValues } from './build'
import { F, ROW_PRODUCT, ROW_OPTION, OPTION_VALUE_PLACEHOLDER, optionGroupCols } from './salla'
import { emptyConfig } from './types'
import type { SourceSheet } from './reader'

function sheet(headers: string[], rows: Record<string, string>[]): SourceSheet {
  return { name: 'src', headers, rows }
}

describe('value helpers', () => {
  it('cleanPrice strips currency + separators, blanks dashes', () => {
    expect(cleanPrice('1,299 ر.س')).toBe('1299')
    expect(cleanPrice('$ 49.00')).toBe('49.00')
    expect(cleanPrice('-')).toBe('')
    expect(cleanPrice('')).toBe('')
  })

  it('splitValues splits on comma / Arabic comma / pipe / newline', () => {
    expect(splitValues('XL, L | S\nM،XS')).toEqual(['XL', 'L', 'S', 'M', 'XS'])
    expect(splitValues('')).toEqual([])
  })

  it('cleanMaxQty blanks values below 1 (Salla rejects 0)', () => {
    expect(cleanMaxQty('0')).toBe('')
    expect(cleanMaxQty('-3')).toBe('')
    expect(cleanMaxQty('')).toBe('')
    expect(cleanMaxQty('abc')).toBe('')
    expect(cleanMaxQty('5')).toBe('5')
    expect(cleanMaxQty('2.9')).toBe('2')
  })
})

describe('buildRows', () => {
  it('emits one منتج row with cleaned price and applied defaults', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.fields[F.price] = { kind: 'column', column: 'price' }

    const { rows, productCount, optionCount } = buildRows(
      sheet(['title', 'price'], [{ title: 'قميص', price: '99 ر.س' }]),
      config,
    )

    expect(productCount).toBe(1)
    expect(optionCount).toBe(0)
    expect(rows[0][F.type]).toBe(ROW_PRODUCT)
    expect(rows[0][F.name]).toBe('قميص')
    expect(rows[0][F.price]).toBe('99')
    // required weight default present on the product row
    expect(rows[0][F.weight]).toBe('1')
    expect(rows[0][F.weightUnit]).toBe('kg')
  })

  it('expands a size option into خيار rows and keeps the parent placeholder', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.fields[F.price] = { kind: 'column', column: 'price' }
    config.sku = { mode: 'auto', prefix: 'SKU-' }
    config.options = [{ column: 'size', name: 'المقاس', type: 'text' }]

    const { rows, productCount, optionCount } = buildRows(
      sheet(['title', 'price', 'size'], [{ title: 'قميص', price: '100', size: 'S,M,L' }]),
      config,
    )

    expect(productCount).toBe(1)
    expect(optionCount).toBe(3)

    const g1 = optionGroupCols(1)
    const parent = rows[0]
    expect(parent[F.type]).toBe(ROW_PRODUCT)
    expect(parent[g1.name]).toBe('المقاس')
    expect(parent[g1.value]).toBe(OPTION_VALUE_PLACEHOLDER)
    expect(parent[F.sku]).toBe('SKU-1')

    const variants = rows.slice(1)
    expect(variants.map((r) => r[F.type])).toEqual([ROW_OPTION, ROW_OPTION, ROW_OPTION])
    expect(variants.map((r) => r[g1.value])).toEqual(['S', 'M', 'L'])
    // variant sku = {parentSku}-{value}, inherits price + weight default
    expect(variants[0][F.sku]).toBe('SKU-1-S')
    expect(variants[0][F.price]).toBe('100')
    expect(variants[0][F.weight]).toBe('1')
  })

  it('never auto-generates العنوان الترويجي — stays empty unless the user maps/edits it', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    const { rows } = buildRows(sheet(['title'], [{ title: 'عباية سوداء كلوش' }]), config)
    expect(rows[0][F.promoTitle]).toBeUndefined()
  })

  it('passes a mapped العنوان الترويجي straight through, untouched', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.fields[F.promoTitle] = { kind: 'column', column: 'promo' }
    const { rows } = buildRows(
      sheet(['title', 'promo'], [{ title: 'x', promo: 'عرض الشتاء' }]),
      config,
    )
    expect(rows[0][F.promoTitle]).toBe('عرض الشتاء')
  })

  it('replaces a mapped max-qty of 0 with the >= 1 default (Salla rule)', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.fields[F.maxQty] = { kind: 'column', column: 'stock' }

    const { rows } = buildRows(
      sheet(['title', 'stock'], [
        { title: 'أ', stock: '0' }, // 0 blanked, then filled by default
        { title: 'ب', stock: '3' }, // valid value kept
      ]),
      config,
    )
    expect(rows[0][F.maxQty]).toBe(config.defaults.maxQtyPerCustomer)
    expect(rows[1][F.maxQty]).toBe('3')
  })

  it('fills max-qty default on every row (product + variant) when unmapped', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.options = [{ column: 'size', name: 'المقاس', type: 'text' }]

    const { rows } = buildRows(
      sheet(['title', 'size'], [{ title: 'قميص', size: 'S,M' }]),
      config,
    )
    // parent + both variant rows all carry a valid max-qty
    expect(rows.every((r) => r[F.maxQty] === '10000')).toBe(true)
  })

  it('applies per-product overrides (name / price / category) and exposes row meta', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.fields[F.price] = { kind: 'column', column: 'price' }
    config.fields[F.category] = { kind: 'column', column: 'cat' }

    const src = sheet(['title', 'price', 'cat'], [
      { title: 'أ', price: '100', cat: 'shirts' },
      { title: 'ب', price: '200', cat: 'pants' },
    ])
    // Row 0: rename + reprice + recategorize. Row 1: clear category.
    const { rows, meta } = buildRows(src, config, {
      0: { [F.name]: 'قميص جديد', [F.price]: '150 ر.س', [F.category]: 'قمصان' },
      1: { [F.category]: '' },
    })

    expect(rows[0][F.name]).toBe('قميص جديد')
    expect(rows[0][F.price]).toBe('150') // override runs through cleanPrice
    expect(rows[0][F.category]).toBe('قمصان')
    expect(rows[1][F.category]).toBeUndefined()
    expect(meta[0]).toEqual({ sourceIndex: 0, isProduct: true })
    expect(meta).toHaveLength(rows.length)
  })

  it('an edited parent price flows down to its variant rows', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.fields[F.price] = { kind: 'column', column: 'price' }
    config.options = [{ column: 'size', name: 'المقاس', type: 'text' }]

    const src = sheet(['title', 'price', 'size'], [{ title: 'قميص', price: '100', size: 'S,M' }])
    const { rows } = buildRows(src, config, { 0: { [F.price]: '199' } })

    // parent + both variants carry the edited price
    expect(rows.every((r) => r[F.price] === '199')).toBe(true)
  })

  it('excludes a removed item and all its variant rows', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.options = [{ column: 'size', name: 'المقاس', type: 'text' }]

    const src = sheet(['title', 'size'], [
      { title: 'أ', size: 'S,M' }, // index 0 → 1 product + 2 variants
      { title: 'ب', size: 'L' }, // index 1 → 1 product + 1 variant
    ])
    const { rows, productCount, optionCount } = buildRows(src, config, {}, new Set([0]))

    expect(productCount).toBe(1)
    expect(optionCount).toBe(1)
    expect(rows.every((r) => r[F.name] !== 'أ')).toBe(true)
    expect(rows[0][F.name]).toBe('ب')
  })

  it('leaves نوع المنتج / يتطلب شحن EMPTY on خيار rows, filled on the منتج row', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.options = [{ column: 'size', name: 'المقاس', type: 'text' }]

    const { rows } = buildRows(
      sheet(['title', 'size'], [{ title: 'قميص', size: 'S,M' }]),
      config,
    )
    const [parent, ...variants] = rows
    expect(parent[F.productType]).toBe('منتج جاهز')
    expect(parent[F.requiresShipping]).toBe('نعم')
    for (const v of variants) {
      expect(v[F.productType]).toBeUndefined()
      expect(v[F.requiresShipping]).toBeUndefined()
      // weight is still required on every row
      expect(v[F.weight]).toBe('1')
    }
  })

  it('drops URL/garbage option values and dedupes; all-empty option → simple product', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.options = [{ column: 'opt', name: 'المقاس', type: 'text' }]

    // Only S and M survive (URL dropped, duplicate S deduped)
    const mixed = buildRows(
      sheet(['title', 'opt'], [{ title: 'أ', opt: 'S, https://x/y, S, M' }]),
      config,
    )
    expect(mixed.optionCount).toBe(2)
    const g1 = optionGroupCols(1)
    expect(mixed.rows.slice(1).map((r) => r[g1.value])).toEqual(['S', 'M'])

    // A row whose only option value is a URL → no variants, no option group declared
    const junk = buildRows(
      sheet(['title', 'opt'], [{ title: 'ب', opt: 'https://x/z' }]),
      config,
    )
    expect(junk.productCount).toBe(1)
    expect(junk.optionCount).toBe(0)
    expect(junk.rows[0][g1.name]).toBeUndefined()
  })

  it('reads a color swatch as hex onto the variant row', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.options = [{ column: 'color', name: 'اللون', type: 'color' }]

    const { rows } = buildRows(
      sheet(['title', 'color'], [{ title: 'حذاء', color: '#FF0000,#00FF00' }]),
      config,
    )
    const g1 = optionGroupCols(1)
    const variants = rows.slice(1)
    expect(variants[0][g1.value]).toBe('#FF0000')
    expect(variants[0][g1.swatch]).toBe('#FF0000')
  })
})

describe('validate', () => {
  it('flags missing name/price and missing weight as blocking errors', () => {
    const rows = [
      { [F.type]: ROW_PRODUCT, [F.name]: '', [F.price]: '', [F.weight]: '' },
    ]
    const v = validate(rows)
    expect(v.ok).toBe(false)
    const messages = v.errors.map((e) => e.message)
    expect(messages.some((m) => m.includes('اسم منتج'))).toBe(true)
    expect(messages.some((m) => m.includes('سعر'))).toBe(true)
    expect(messages.some((m) => m.includes('الوزن'))).toBe(true)
  })

  it('points to the offending product by name + sheet row', () => {
    const rows = [
      { [F.type]: ROW_PRODUCT, [F.name]: 'قميص', [F.price]: '100', [F.weight]: '1' },
      { [F.type]: ROW_PRODUCT, [F.name]: 'بنطال', [F.price]: '', [F.weight]: '1' },
    ]
    const v = validate(rows)
    const priceIssue = v.errors.find((e) => e.message.includes('سعر'))
    expect(priceIssue?.count).toBe(1)
    // second data row => spreadsheet row 4 (label + header + 2 data rows)
    expect(priceIssue?.examples).toEqual(['«بنطال» (#4)'])
  })

  it('flags an orphan خيار row with no preceding منتج', () => {
    const rows = [{ [F.type]: ROW_OPTION, [F.weight]: '1' }]
    const v = validate(rows)
    expect(v.errors.some((e) => e.message.includes('أب'))).toBe(true)
  })

  it('blocks a العنوان الترويجي over 25 chars; passes a short one / absent one', () => {
    const long = { [F.type]: ROW_PRODUCT, [F.name]: 'أ', [F.price]: '10', [F.weight]: '1', [F.promoTitle]: 'عرض خاص لفترة محدودة جدًا على هذا المنتج' }
    const short = { [F.type]: ROW_PRODUCT, [F.name]: 'ب', [F.price]: '10', [F.weight]: '1', [F.promoTitle]: 'عرض الشتاء' }
    const none = { [F.type]: ROW_PRODUCT, [F.name]: 'ج', [F.price]: '10', [F.weight]: '1' }

    expect(validate([long]).errors.some((e) => e.code === 'promoTitleTooLong')).toBe(true)
    expect(validate([short]).errors.some((e) => e.code === 'promoTitleTooLong')).toBe(false)
    expect(validate([none]).errors.some((e) => e.code === 'promoTitleTooLong')).toBe(false)
  })

  it('flags a خيار row that carries no option value', () => {
    const g1 = optionGroupCols(1)
    const rows = [
      { [F.type]: ROW_PRODUCT, [F.name]: 'قميص', [F.price]: '10', [F.weight]: '1', [g1.name]: 'المقاس' },
      { [F.type]: ROW_OPTION, [F.weight]: '1' }, // no value cell filled
    ]
    const v = validate(rows)
    expect(v.errors.some((e) => e.code === 'emptyOptionValue')).toBe(true)
  })

  it('flags an option name that still looks like a scrape selector', () => {
    const g1 = optionGroupCols(1)
    const rows = [
      {
        [F.type]: ROW_PRODUCT,
        [F.name]: 'قميص',
        [F.price]: '10',
        [F.weight]: '1',
        [g1.name]: '_buttonOptionsCtr_14os5_1',
      },
    ]
    const v = validate(rows)
    expect(v.errors.some((e) => e.code === 'selectorName')).toBe(true)
  })

  it('passes a well-formed product row and only warns on missing image/category', () => {
    const rows = [
      { [F.type]: ROW_PRODUCT, [F.name]: 'x', [F.price]: '10', [F.weight]: '1' },
    ]
    const v = validate(rows)
    expect(v.ok).toBe(true)
    expect(v.warnings.length).toBeGreaterThan(0)
  })
})
