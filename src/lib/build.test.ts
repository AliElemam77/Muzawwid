import { describe, it, expect } from 'vitest'
import {
  buildRows,
  validate,
  cleanPrice,
  cleanMaxQty,
  splitValues,
  clampPromoTitle,
  optionValueKey,
} from './build'
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

  it('clampPromoTitle keeps <= 25 chars, cutting at a word boundary', () => {
    expect(clampPromoTitle('عرض الشتاء')).toBe('عرض الشتاء')
    expect(clampPromoTitle('  عرض   الشتاء ')).toBe('عرض الشتاء') // whitespace collapsed
    expect(clampPromoTitle('')).toBe('')
    // 26 chars → cut back to the last space, no trailing punctuation left
    const out = clampPromoTitle('عرض خاص لفترة محدودة جدًا على هذا المنتج')
    expect(out).toBe('عرض خاص لفترة محدودة')
    expect(out.length).toBeLessThanOrEqual(25)
    // no usable word boundary → hard cut at 25
    expect(clampPromoTitle('x'.repeat(40))).toBe('x'.repeat(25))
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

  it('merges two columns mapped with the SAME option name into ONE group (52, 54), not two groups', () => {
    // Reproduces a scraped size grid where each value lands in its own column
    // (size1='52', size2='54') but both are named المقاس — must become one
    // "المقاس" group with 2 خيار rows, never two separate single-value groups.
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.options = [
      { column: 'size1', name: 'المقاس', type: 'text' },
      { column: 'size2', name: 'المقاس', type: 'text' },
    ]

    const { rows, productCount, optionCount } = buildRows(
      sheet(['title', 'size1', 'size2'], [{ title: 'حذاء', size1: '52', size2: '54' }]),
      config,
    )

    expect(productCount).toBe(1)
    expect(optionCount).toBe(2) // one خيار row per value, not a 1x1 cartesian combo

    const g1 = optionGroupCols(1)
    const g2 = optionGroupCols(2)
    const parent = rows[0]
    // Only ONE group declared (المقاس) — group 2 must stay empty.
    expect(parent[g1.name]).toBe('المقاس')
    expect(parent[g2.name]).toBeUndefined()

    const variants = rows.slice(1)
    expect(variants).toHaveLength(2)
    expect(variants.map((r) => r[g1.value]).sort()).toEqual(['52', '54'])
    // No variant should carry a value in group 2 (there is no second group).
    expect(variants.every((r) => r[g2.value] === undefined)).toBe(true)
  })

  it('derives العنوان الترويجي from the name when nothing is mapped', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    const { rows } = buildRows(sheet(['title'], [{ title: 'عباية سوداء كلوش' }]), config)
    expect(rows[0][F.promoTitle]).toBe('عباية سوداء كلوش')
  })

  it('falls back to the description when configured, and flattens its HTML', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.fields[F.description] = { kind: 'column', column: 'desc' }
    config.promoTitle = { truncate: true, fallback: 'description' }

    const { rows } = buildRows(
      sheet(['title', 'desc'], [{ title: 'قميص', desc: '<p>قطن مصري</p>' }]),
      config,
    )
    expect(rows[0][F.promoTitle]).toBe('قطن مصري')
  })

  it('falls back to the name when the configured description is empty', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.promoTitle = { truncate: true, fallback: 'description' }
    const { rows } = buildRows(sheet(['title'], [{ title: 'قميص' }]), config)
    expect(rows[0][F.promoTitle]).toBe('قميص')
  })

  it('leaves العنوان الترويجي empty when the fallback is disabled', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.promoTitle = { truncate: true, fallback: 'none' }
    const { rows } = buildRows(sheet(['title'], [{ title: 'عباية' }]), config)
    expect(rows[0][F.promoTitle]).toBeUndefined()
  })

  it('clamps a mapped العنوان الترويجي to 25 chars at a word boundary', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.fields[F.promoTitle] = { kind: 'column', column: 'promo' }
    const { rows } = buildRows(
      sheet(['title', 'promo'], [
        { title: 'x', promo: 'عرض الشتاء' }, // short → untouched
        { title: 'y', promo: 'عرض خاص لفترة محدودة جدًا على هذا المنتج' },
      ]),
      config,
    )
    expect(rows[0][F.promoTitle]).toBe('عرض الشتاء')

    const clamped = rows[1][F.promoTitle]!
    expect(clamped.length).toBeLessThanOrEqual(25)
    expect(clamped).toBe('عرض خاص لفترة محدودة')
    // validate must agree: a clamped title never trips the length error
    expect(validate(rows).errors.some((e) => e.code === 'promoTitleTooLong')).toBe(false)
  })

  it('hard-cuts a long single word rather than leaving a stub', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    const { rows } = buildRows(sheet(['title'], [{ title: 'ab ' + 'x'.repeat(40) }]), config)
    expect(rows[0][F.promoTitle]).toBe(('ab ' + 'x'.repeat(40)).slice(0, 25))
  })

  it('keeps a long العنوان الترويجي as-is when truncation is turned off', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.fields[F.promoTitle] = { kind: 'column', column: 'promo' }
    config.promoTitle = { truncate: false, fallback: 'name' }
    const long = 'عرض خاص لفترة محدودة جدًا على هذا المنتج'
    const { rows } = buildRows(sheet(['title', 'promo'], [{ title: 'x', promo: long }]), config)
    expect(rows[0][F.promoTitle]).toBe(long)
    // …and then validate is what tells the user (this is the escape hatch).
    expect(validate(rows).errors.some((e) => e.code === 'promoTitleTooLong')).toBe(true)
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

  it('reads the option name from a column, per row, with the fixed name as fallback', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.options = [{ column: 'val', name: 'خيار', type: 'text', nameColumn: 'label' }]

    const { rows } = buildRows(
      sheet(['title', 'label', 'val'], [
        { title: 'أ', label: 'المقاس', val: 'S' },
        { title: 'ب', label: 'الحجم', val: 'L' },
        { title: 'ج', label: '', val: 'M' }, // empty cell → fixed name
      ]),
      config,
    )
    const g1 = optionGroupCols(1)
    const products = rows.filter((r) => r[F.type] === ROW_PRODUCT)
    expect(products.map((r) => r[g1.name])).toEqual(['المقاس', 'الحجم', 'خيار'])
  })

  it('merges two columns into one axis when they resolve to the SAME name on a row', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.options = [
      { column: 'v1', name: 'خيار', type: 'text', nameColumn: 'l1' },
      { column: 'v2', name: 'خيار', type: 'text', nameColumn: 'l2' },
    ]

    const { rows, optionCount } = buildRows(
      sheet(['title', 'l1', 'v1', 'l2', 'v2'], [
        // Both columns say المقاس on this row → ONE axis holding 52 and 54.
        { title: 'حذاء', l1: 'المقاس', v1: '52', l2: 'المقاس', v2: '54' },
      ]),
      config,
    )
    const g1 = optionGroupCols(1)
    const g2 = optionGroupCols(2)
    expect(optionCount).toBe(2)
    expect(rows[0][g1.name]).toBe('المقاس')
    expect(rows[0][g2.name]).toBeUndefined()
    expect(rows.slice(1).map((r) => r[g1.value])).toEqual(['52', '54'])
  })

  it('applies manual option edits: rename an axis, rewrite a value, drop a value', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.sku = { mode: 'auto', prefix: 'SKU-' }
    config.options = [{ column: 'size', name: 'خيار', type: 'text' }]

    const src = sheet(['title', 'size'], [{ title: 'قميص', size: 'S,M,L' }])
    const { rows, optionCount, meta } = buildRows(src, config, {}, new Set(), {
      0: {
        names: { 0: 'المقاس' },
        values: { [optionValueKey(0, 'M')]: 'ميديم' },
        removed: [optionValueKey(0, 'L')],
      },
    })

    const g1 = optionGroupCols(1)
    expect(rows[0][g1.name]).toBe('المقاس')
    expect(optionCount).toBe(2) // L dropped
    expect(rows.slice(1).map((r) => r[g1.value])).toEqual(['S', 'ميديم'])
    // the rewritten value flows into the variant SKU too
    expect(rows[2][F.sku]).toBe('SKU-1-ميديم')
    // meta still keys the edit by the ORIGINAL value, so re-editing works
    expect(meta[2].picks).toEqual([{ axisIndex: 0, original: 'M', value: 'ميديم' }])
    expect(meta[0].axes).toEqual([{ axisIndex: 0, name: 'المقاس' }])
  })

  it('drops the option group entirely when every value was removed manually', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.options = [{ column: 'size', name: 'المقاس', type: 'text' }]

    const src = sheet(['title', 'size'], [{ title: 'قميص', size: 'S,M' }])
    const { rows, productCount, optionCount, meta } = buildRows(src, config, {}, new Set(), {
      0: { removed: [optionValueKey(0, 'S'), optionValueKey(0, 'M')] },
    })

    // A parent declaring a group with no خيار rows is exactly what Salla rejects.
    expect(productCount).toBe(1)
    expect(optionCount).toBe(0)
    expect(rows).toHaveLength(1)
    expect(rows[0][optionGroupCols(1).name]).toBeUndefined()
    expect(meta[0].axes).toBeUndefined()
  })

  it('lets a hand-edited image list override the mapped columns', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.imageColumns = ['img']

    const src = sheet(['title', 'img'], [{ title: 'قميص', img: 'https://cdn.x/old.jpg' }])
    const { rows } = buildRows(src, config, {
      0: { [F.image]: 'https://cdn.x/a.jpg, https://cdn.x/b.jpg, https://cdn.x/a.jpg' },
    })
    // de-duplicated and comma-joined, same shape the merge produces
    expect(rows[0][F.image]).toBe('https://cdn.x/a.jpg,https://cdn.x/b.jpg')
  })

  it('derives سعر التكلفة and السعر المخفض from سعر المنتج', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.fields[F.price] = { kind: 'column', column: 'price' }
    config.priceRules = [
      { target: 'cost', source: 'price', op: 'percentOff', value: '30' },
      { target: 'salePrice', source: 'price', op: 'percentOff', value: '10' },
    ]

    const { rows } = buildRows(
      sheet(['title', 'price'], [{ title: 'قميص', price: '200 ر.س' }]),
      config,
    )
    expect(rows[0][F.price]).toBe('200')
    expect(rows[0][F.cost]).toBe('140') // 200 − 30%
    expect(rows[0][F.discountPrice]).toBe('180') // 200 − 10%
  })

  it('runs price rules in order, so one can build on the previous result', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.fields[F.price] = { kind: 'column', column: 'price' }
    config.priceRules = [
      { target: 'cost', source: 'price', op: 'percentOff', value: '50' }, // 100 → 50
      { target: 'salePrice', source: 'cost', op: 'add', value: '5' }, // reads the NEW cost
    ]
    const { rows } = buildRows(sheet(['title', 'price'], [{ title: 'x', price: '100' }]), config)
    expect(rows[0][F.cost]).toBe('50')
    expect(rows[0][F.discountPrice]).toBe('55')
  })

  it('a price rule sees the EDITED price and its result reaches the variants', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.fields[F.price] = { kind: 'column', column: 'price' }
    config.options = [{ column: 'size', name: 'المقاس', type: 'text' }]
    config.priceRules = [{ target: 'salePrice', source: 'price', op: 'percentOff', value: '10' }]

    const src = sheet(['title', 'price', 'size'], [{ title: 'قميص', price: '100', size: 'S,M' }])
    // The user retyped the price in the preview → the formula must follow it.
    const { rows } = buildRows(src, config, { 0: { [F.price]: '200' } })

    expect(rows[0][F.discountPrice]).toBe('180')
    // parent + both خيار rows all carry the derived discount
    expect(rows.every((r) => r[F.discountPrice] === '180')).toBe(true)
    expect(rows.every((r) => r[F.price] === '200')).toBe(true)
  })

  it('skips a price rule whose source is empty, leaving the target untouched', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.fields[F.price] = { kind: 'column', column: 'price' }
    // No cost column mapped → cost is empty → the rule reading it is skipped.
    config.priceRules = [{ target: 'salePrice', source: 'cost', op: 'add', value: '5' }]
    const { rows } = buildRows(sheet(['title', 'price'], [{ title: 'x', price: '100' }]), config)
    expect(rows[0][F.discountPrice]).toBeUndefined()
    expect(rows[0][F.price]).toBe('100')
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

  it('keeps an IMAGE option whose values are URLs (does not drop it)', () => {
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'title' }
    config.options = [{ column: 'img', name: 'الصورة', type: 'image' }]

    const { rows, productCount, optionCount } = buildRows(
      sheet(
        ['title', 'img'],
        [{ title: 'حذاء', img: 'https://cdn.x/a.jpg, https://cdn.x/b.jpg' }],
      ),
      config,
    )
    const g1 = optionGroupCols(1)
    const parent = rows[0]
    const variants = rows.slice(1)

    // one product + two خيار rows (previously ZERO — the URLs were dropped)
    expect(productCount).toBe(1)
    expect(optionCount).toBe(2)
    // parent declares the group; children carry the URL as value AND image
    expect(parent[g1.name]).toBe('الصورة')
    expect(parent[g1.value]).toBe(OPTION_VALUE_PLACEHOLDER)
    expect(variants[0][g1.value]).toBe('https://cdn.x/a.jpg')
    expect(variants[0][g1.swatch]).toBe('https://cdn.x/a.jpg')
    expect(variants[1][g1.value]).toBe('https://cdn.x/b.jpg')
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

  it('flags a declared option group whose name was cleared', () => {
    const g1 = optionGroupCols(1)
    const rows = [
      {
        [F.type]: ROW_PRODUCT,
        [F.name]: 'قميص',
        [F.price]: '10',
        [F.weight]: '1',
        [g1.name]: '',
        [g1.value]: OPTION_VALUE_PLACEHOLDER,
      },
      { [F.type]: ROW_OPTION, [F.weight]: '1', [g1.value]: 'S' },
    ]
    const v = validate(rows)
    expect(v.errors.some((e) => e.code === 'missingOptionName')).toBe(true)
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

  it('warns when the images cell holds text that is not a link', () => {
    const rows = [
      {
        [F.type]: ROW_PRODUCT,
        [F.name]: 'قميص',
        [F.price]: '10',
        [F.weight]: '1',
        [F.image]: 'صورة المنتج.jpg',
      },
    ]
    const v = validate(rows)
    expect(v.warnings.some((w) => w.code === 'imageNotUrl')).toBe(true)
    expect(v.ok).toBe(true) // a warning must never block the export
  })

  it('warns when an image link does not look like an image (a page URL)', () => {
    const rows = [
      {
        [F.type]: ROW_PRODUCT,
        [F.name]: 'قميص',
        [F.price]: '10',
        [F.weight]: '1',
        [F.image]: 'https://shop.example.com/products/shirt',
      },
    ]
    const v = validate(rows)
    expect(v.warnings.some((w) => w.code === 'imageNotImage')).toBe(true)
  })

  it('accepts real image links silently, extension-less CDN links included', () => {
    const rows = [
      {
        [F.type]: ROW_PRODUCT,
        [F.name]: 'قميص',
        [F.price]: '10',
        [F.weight]: '1',
        [F.image]: 'https://cdn.x/a.jpg,https://cdn.salla.sa/abc123,https://x.io/i?format=webp',
      },
    ]
    const v = validate(rows)
    expect(v.warnings.some((w) => w.code === 'imageNotUrl')).toBe(false)
    expect(v.warnings.some((w) => w.code === 'imageNotImage')).toBe(false)
    expect(v.warnings.some((w) => w.code === 'missingImage')).toBe(false)
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
