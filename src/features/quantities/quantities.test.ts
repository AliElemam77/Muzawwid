import { describe, it, expect } from 'vitest'
import { normalizeArabic, sameName } from './normalizeArabic'
import { combinations, combinationCount, variantName } from './combinations'
import { buildQuantityRows, removeRows, withVariants } from './buildRows'
import { LIMITED, UNLIMITED, type OptionGroup, type Unlimited } from './types'

const group = (name: string, values: string[]): OptionGroup => ({ id: name, name, values })

describe('normalizeArabic', () => {
  it('folds every form of alef to ا', () => {
    expect(normalizeArabic('أحمد')).toBe('احمد')
    expect(normalizeArabic('إسلام')).toBe('اسلام')
    expect(normalizeArabic('آية')).toBe('ايه')
  })

  it('folds ى to ي and ة to ه', () => {
    expect(normalizeArabic('مصطفى')).toBe('مصطفي')
    expect(normalizeArabic('بلوزة')).toBe('بلوزه')
  })

  it('collapses runs of whitespace and trims', () => {
    expect(normalizeArabic('  بلوزة   حمراء  ')).toBe('بلوزه حمراء')
    expect(normalizeArabic('بلوزة\nحمراء')).toBe('بلوزه حمراء')
  })

  it('matches the spellings a store and a spreadsheet disagree on', () => {
    expect(sameName('بلوزة هاوس أوف يمينة', 'بلوزه هاوس اوف يمينه')).toBe(true)
    expect(sameName('بلوزة حمراء', 'بلوزة زرقاء')).toBe(false)
  })

  it('survives an empty or missing value', () => {
    expect(normalizeArabic('')).toBe('')
    expect(normalizeArabic(undefined as unknown as string)).toBe('')
  })
})

describe('combinations', () => {
  it('expands a single group', () => {
    expect(combinations([group('اللون', ['أحمر', 'أزرق'])])).toEqual([['أحمر'], ['أزرق']])
  })

  it('varies the FIRST group slowest, like Salla orders them', () => {
    const out = combinations([group('اللون', ['White', 'Black']), group('المقاس', ['40', '42'])])
    expect(out).toEqual([
      ['White', '40'],
      ['White', '42'],
      ['Black', '40'],
      ['Black', '42'],
    ])
  })

  it('handles three groups', () => {
    const out = combinations([
      group('اللون', ['أحمر', 'أزرق']),
      group('المقاس', ['S', 'M']),
      group('الخامة', ['قطن', 'حرير']),
    ])
    expect(out).toHaveLength(8)
    expect(out[0]).toEqual(['أحمر', 'S', 'قطن'])
    expect(out[7]).toEqual(['أزرق', 'M', 'حرير'])
  })

  it('handles four groups — the acceptance case for "unlimited groups"', () => {
    const out = combinations([
      group('اللون', ['أحمر', 'أزرق']),
      group('المقاس', ['S', 'M', 'L']),
      group('الخامة', ['قطن', 'حرير']),
      group('النمط', ['سادة', 'مطبوع']),
    ])
    expect(out).toHaveLength(2 * 3 * 2 * 2)
    expect(new Set(out.map((c) => c.join('/'))).size).toBe(out.length)
  })

  it('skips a group with no values instead of wiping the product', () => {
    const out = combinations([group('اللون', ['أحمر']), group('المقاس', [])])
    expect(out).toEqual([['أحمر']])
  })

  it('ignores blank and whitespace-only values', () => {
    expect(combinations([group('اللون', ['أحمر', '  ', ''])])).toEqual([['أحمر']])
  })

  it('treats a single-value group as one axis, not as "no options"', () => {
    expect(combinations([group('اللون', ['أحمر'])])).toEqual([['أحمر']])
  })

  it('returns nothing when there is nothing to expand', () => {
    expect(combinations([])).toEqual([])
    expect(combinations([group('اللون', [])])).toEqual([])
  })

  it('counts without building', () => {
    const groups = [group('اللون', ['a', 'b']), group('المقاس', ['1', '2', '3'])]
    expect(combinationCount(groups)).toBe(6)
    expect(combinationCount(groups)).toBe(combinations(groups).length)
    expect(combinationCount([])).toBe(0)
  })
})

describe('variantName', () => {
  it('joins with " - " then bare slashes, exactly as Salla writes it', () => {
    expect(variantName('بلوزة هاوس أوف يمينة', ['White', '40'])).toBe(
      'بلوزة هاوس أوف يمينة - White/40',
    )
    expect(variantName('قميص', ['أحمر'])).toBe('قميص - أحمر')
    expect(variantName('قميص', ['أحمر', 'M', 'قطن'])).toBe('قميص - أحمر/M/قطن')
  })
})

describe('buildQuantityRows', () => {
  const config = (groups: OptionGroup[], defaultQuantity = 0, defaultUnlimited: Unlimited = LIMITED) =>
    ({ groups, defaultQuantity, defaultUnlimited })

  it('gives a product with no options exactly one row', () => {
    const rows = buildQuantityRows([{ name: 'قميص', no: '1805954759' }], config([]))
    expect(rows).toEqual([
      { no: '1805954759', type: 'منتج', name: 'قميص', sku: '', unlimited: LIMITED, quantity: 0 },
    ])
  })

  it('gives a product with options a parent row plus one row per combination', () => {
    const rows = buildQuantityRows(
      [{ name: 'بلوزة هاوس أوف يمينة' }],
      config([group('اللون', ['White']), group('المقاس', ['40', '42'])]),
    )
    expect(rows.map((r) => [r.type, r.name])).toEqual([
      ['منتج', 'بلوزة هاوس أوف يمينة'],
      ['خيار', 'بلوزة هاوس أوف يمينة - White/40'],
      ['خيار', 'بلوزة هاوس أوف يمينة - White/42'],
    ])
  })

  it('gives PRODUCT rows a quantity too, not just variants', () => {
    // The merchant controls stock on every row — a product with no variants
    // would otherwise have nowhere to put a number.
    const rows = buildQuantityRows([{ name: 'قميص' }], config([group('المقاس', ['S', 'M'])], 7))
    for (const row of rows) {
      expect(row.unlimited).toBe(LIMITED)
      expect(row.quantity).toBe(7)
    }
  })

  it('blanks every quantity when the rows are unlimited', () => {
    const rows = buildQuantityRows(
      [{ name: 'قميص' }],
      config([group('المقاس', ['S', 'M'])], 7, UNLIMITED),
    )
    for (const row of rows) {
      expect(row.unlimited).toBe(UNLIMITED)
      expect(row.quantity).toBe('')
    }
  })

  it('defaults the variant quantity to 0', () => {
    const rows = buildQuantityRows([{ name: 'قميص' }], config([group('المقاس', ['S'])]))
    expect(rows[1].quantity).toBe(0)
  })

  it('keeps each product’s variants directly under it, with no gaps', () => {
    const rows = buildQuantityRows(
      [{ name: 'قميص' }, { name: 'بنطلون' }],
      config([group('المقاس', ['S', 'M'])]),
    )
    expect(rows.map((r) => r.type)).toEqual(['منتج', 'خيار', 'خيار', 'منتج', 'خيار', 'خيار'])
    expect(rows[1].name.startsWith('قميص')).toBe(true)
    expect(rows[4].name.startsWith('بنطلون')).toBe(true)
  })

  it('never invents an id for a variant', () => {
    const rows = buildQuantityRows(
      [{ name: 'قميص', no: '1805954759' }],
      config([group('المقاس', ['S'])]),
    )
    expect(rows[1].no).toBe('')
  })

  it('leaves the id blank in generate mode', () => {
    const rows = buildQuantityRows([{ name: 'قميص' }], config([]))
    expect(rows[0].no).toBe('')
  })

  it('carries a SKU only when the product actually has one', () => {
    const [withSku] = buildQuantityRows([{ name: 'قميص', sku: 'SH-1' }], config([]))
    const [without] = buildQuantityRows([{ name: 'قميص' }], config([]))
    expect(withSku.sku).toBe('SH-1')
    expect(without.sku).toBe('')
  })

  it('skips products with no name', () => {
    expect(buildQuantityRows([{ name: '   ' }], config([]))).toEqual([])
  })

  it('deletes a product together with its variants', () => {
    // Deleting the parent alone would leave «قميص - S» pointing at a product
    // that is no longer in the sheet.
    const rows = buildQuantityRows(
      [{ name: 'قميص' }, { name: 'بنطلون' }],
      config([group('المقاس', ['S', 'M'])]),
    )
    expect(removeRows(rows, [0]).map((r) => r.name)).toEqual([
      'بنطلون',
      'بنطلون - S',
      'بنطلون - M',
    ])
  })

  it('deletes a single variant without touching its product', () => {
    const rows = buildQuantityRows([{ name: 'قميص' }], config([group('المقاس', ['S', 'M'])]))
    expect(removeRows(rows, [1]).map((r) => r.name)).toEqual(['قميص', 'قميص - M'])
  })

  it('counts the rows a product deletion really removes', () => {
    const rows = buildQuantityRows([{ name: 'قميص' }], config([group('المقاس', ['S', 'M', 'L'])]))
    expect(withVariants(rows, [0]).size).toBe(4) // parent + 3 variants
    expect(withVariants(rows, [2]).size).toBe(1) // one variant only
  })

  it('deletes several products at once', () => {
    const rows = buildQuantityRows(
      [{ name: 'أ' }, { name: 'ب' }, { name: 'ج' }],
      config([group('المقاس', ['S'])]),
    )
    expect(removeRows(rows, [0, 4]).map((r) => r.name)).toEqual(['ب', 'ب - S'])
  })

  it('leaves the sheet alone when nothing is selected', () => {
    const rows = buildQuantityRows([{ name: 'قميص' }], config([]))
    expect(removeRows(rows, [])).toEqual(rows)
  })

  it('scales to a large catalogue', () => {
    const products = Array.from({ length: 50 }, (_, i) => ({ name: `منتج ${i}` }))
    const rows = buildQuantityRows(
      products,
      config([group('اللون', ['أحمر', 'أزرق', 'أخضر']), group('المقاس', ['S', 'M', 'L', 'XL'])]),
    )
    // 50 parents + 50 × 12 variants
    expect(rows).toHaveLength(50 + 600)
  })
})
