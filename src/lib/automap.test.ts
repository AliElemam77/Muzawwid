import { describe, it, expect } from 'vitest'
import { autoMap } from './automap'
import { buildProducts } from './product'
import { F } from './salla'
import type { SourceSheet } from './reader'

function sheet(headers: string[], rows: Record<string, string>[]): SourceSheet {
  return { name: 'src', headers, rows }
}

describe('autoMap — option column guardrails', () => {
  it('keeps a real size column and drops scrape selector / href columns', () => {
    const s = sheet(
      ['title', 'price', 'size', '_buttonOptionsCtr_14os5_1', 'reviews href'],
      [
        { title: 'حذاء', price: '200', size: '40 EU', _buttonOptionsCtr_14os5_1: 'x', 'reviews href': 'https://noon.com/a#ReviewArea' },
        { title: 'حذاء', price: '200', size: '41 EU', _buttonOptionsCtr_14os5_1: 'y', 'reviews href': 'https://noon.com/b#ReviewArea' },
        { title: 'حذاء', price: '200', size: '42 EU', _buttonOptionsCtr_14os5_1: 'z', 'reviews href': 'https://noon.com/c#ReviewArea' },
      ],
    )
    const config = autoMap(s)

    // exactly one option survives — the size column, named المقاس
    expect(config.options).toHaveLength(1)
    expect(config.options[0].column).toBe('size')
    expect(config.options[0].name).toBe('المقاس')
    expect(config.options[0].type).toBe('text')

    // title / price still map to their fields
    expect(config.fields[F.name]).toEqual({ kind: 'column', column: 'title' })
    expect(config.fields[F.price]).toEqual({ kind: 'column', column: 'price' })
  })

  it('drops a column whose values are mostly URLs even with a neutral header', () => {
    const s = sheet(
      ['variant'],
      [{ variant: 'https://x/1' }, { variant: 'https://x/2' }, { variant: 'https://x/3' }],
    )
    expect(autoMap(s).options).toHaveLength(0)
  })

  it('detects a color option by hex values and names it اللون', () => {
    const s = sheet(
      ['shade'],
      [{ shade: '#FF0000' }, { shade: '#00FF00' }, { shade: '#0000FF' }],
    )
    const config = autoMap(s)
    expect(config.options).toHaveLength(1)
    expect(config.options[0].name).toBe('اللون')
    expect(config.options[0].type).toBe('color')
  })

  it('keeps same-named option columns so their values MERGE into one axis', () => {
    const s = sheet(
      ['size', 'size (2)', 'size (3)'],
      [{ size: 'S', 'size (2)': 'M', 'size (3)': 'L' }],
    )
    const config = autoMap(s)
    // all three columns are kept, sharing the ONE axis name المقاس
    expect(config.options).toHaveLength(3)
    expect(config.options.every((o) => o.name === 'المقاس')).toBe(true)
    // and the builder merges them into a single option carrying S/M/L
    // (previously only 'S' survived — M and L were dropped)
    const [p] = buildProducts(s, config)
    expect(p.options).toHaveLength(1)
    expect(p.options[0].values).toEqual(['S', 'M', 'L'])
  })

  it('caps DISTINCT option axes at 3 (a 4th distinct axis is skipped)', () => {
    const s = sheet(
      ['color', 'size', 'option style', 'option shape'],
      [
        { color: '#FF0000', size: 'S', 'option style': 'A', 'option shape': 'round' },
        { color: '#00FF00', size: 'M', 'option style': 'B', 'option shape': 'square' },
        { color: '#0000FF', size: 'L', 'option style': 'C', 'option shape': 'oval' },
      ],
    )
    const config = autoMap(s)
    const names = new Set(config.options.map((o) => o.name))
    expect(names.size).toBe(3) // only the first 3 distinct axes are kept
    expect(config.options.some((o) => o.column === 'option shape')).toBe(false)
  })

  it('drops an all-identical column (no real variance)', () => {
    const s = sheet(
      ['size'],
      [{ size: 'M' }, { size: 'M' }, { size: 'M' }],
    )
    expect(autoMap(s).options).toHaveLength(0)
  })
})

describe('autoMap — scraped "label + opt-label" families', () => {
  // The shape most variant scrapers emit: a label column naming the axis,
  // followed by one column per available value, repeated per axis.
  const HEADERS = [
    'title',
    'label',
    'opt-label',
    'opt-label (2)',
    'opt-label (3)',
    'label (2)',
    'opt-label (4)',
    'opt-label (5)',
    'opt-label (6)',
  ]

  const ROW = {
    title: 'تيشيرت',
    label: 'اللون: Red',
    'opt-label': 'Red',
    'opt-label (2)': 'Khaki',
    'opt-label (3)': 'Black',
    'label (2)': 'Size',
    'opt-label (4)': 'S',
    'opt-label (5)': 'M',
    'opt-label (6)': 'L',
  }

  it('binds every value column to the label column before it', () => {
    const config = autoMap(sheet(HEADERS, [ROW]))

    const first = config.options.filter((o) => o.nameColumn === 'label')
    const second = config.options.filter((o) => o.nameColumn === 'label (2)')
    expect(first.map((o) => o.column)).toEqual(['opt-label', 'opt-label (2)', 'opt-label (3)'])
    expect(second.map((o) => o.column)).toEqual(['opt-label (4)', 'opt-label (5)', 'opt-label (6)'])
  })

  it('never maps a label column as an option value or a simple field', () => {
    const config = autoMap(sheet(HEADERS, [ROW]))
    expect(config.options.some((o) => o.column === 'label')).toBe(false)
    expect(config.options.some((o) => o.column === 'label (2)')).toBe(false)
    expect(Object.values(config.fields).some((f) => f.kind === 'column' && f.column === 'label')).toBe(false)
  })

  it('builds two axes named from the label cells, with the value stripped off', () => {
    const s = sheet(HEADERS, [ROW])
    const [p] = buildProducts(s, autoMap(s))

    expect(p.options).toHaveLength(2)
    // «اللون: Red» names the axis اللون — "Red" is a value, not part of the name.
    expect(p.options[0].nameAr).toBe('اللون')
    expect(p.options[0].values).toEqual(['Red', 'Khaki', 'Black'])
    expect(p.options[1].nameAr).toBe('Size')
    expect(p.options[1].values).toEqual(['S', 'M', 'L'])
  })

  it('lets the axis name differ per row (same columns, different product)', () => {
    const s = sheet(HEADERS, [
      ROW,
      { ...ROW, label: 'Size', 'opt-label': 'S', 'opt-label (2)': 'M', 'opt-label (3)': 'L', 'label (2)': '' },
    ])
    const products = buildProducts(s, autoMap(s))
    expect(products[1].options[0].nameAr).toBe('Size')
    expect(products[1].options[0].values).toEqual(['S', 'M', 'L'])
  })
})

describe('autoMap — an Arabic sheet must not lose its price column', () => {
  /** The shape almost every Arabic sheet in this tool actually has. */
  const arabicSheet = () =>
    sheet(
      ['اسم المنتج', 'السعر', 'التصنيف', 'الوصف'],
      [
        { 'اسم المنتج': 'باور بانك', السعر: '179', التصنيف: 'شواحن', الوصف: 'وصف' },
        { 'اسم المنتج': 'شاحن جداري', السعر: '289', التصنيف: 'شواحن', الوصف: 'وصف' },
        { 'اسم المنتج': 'كيبل', السعر: '349', التصنيف: 'كيابل', الوصف: 'وصف' },
      ],
    )

  it('maps «السعر» to the price field', () => {
    // It used to be claimed as an OPTION before ever reaching the price field:
    // `179` matches both the bare-number size pattern and the loose hex-colour
    // pattern, and the blacklist that would have saved it was English-only.
    expect(autoMap(arabicSheet()).fields[F.price]).toEqual({ kind: 'column', column: 'السعر' })
  })

  it('never claims «السعر» as an option', () => {
    expect(autoMap(arabicSheet()).options.map((o) => o.column)).not.toContain('السعر')
  })

  it('keeps other Arabic field columns out of the options too', () => {
    const s = sheet(
      ['اسم المنتج', 'سعر التكلفة', 'الوزن', 'الباركود', 'رمز المنتج', 'المقاس'],
      [
        { 'اسم المنتج': 'قميص', 'سعر التكلفة': '120', الوزن: '1', الباركود: '620123', 'رمز المنتج': 'SH1', المقاس: 'S' },
        { 'اسم المنتج': 'قميص', 'سعر التكلفة': '130', الوزن: '2', الباركود: '620124', 'رمز المنتج': 'SH2', المقاس: 'M' },
      ],
    )
    const columns = autoMap(s).options.map((o) => o.column)
    expect(columns).toEqual(['المقاس'])
  })

  it('still recognises a genuine colour column', () => {
    const s = sheet(
      ['اسم المنتج', 'اللون'],
      [
        { 'اسم المنتج': 'قميص', اللون: '#ff0000' },
        { 'اسم المنتج': 'قميص', اللون: '#00ff00' },
      ],
    )
    expect(autoMap(s).options[0]).toMatchObject({ column: 'اللون', type: 'color' })
  })

  it('still recognises a genuine size column of bare numbers', () => {
    const s = sheet(
      ['اسم المنتج', 'المقاس'],
      [
        { 'اسم المنتج': 'تنورة', المقاس: '40' },
        { 'اسم المنتج': 'تنورة', المقاس: '42' },
        { 'اسم المنتج': 'تنورة', المقاس: '44' },
      ],
    )
    expect(autoMap(s).options.map((o) => o.column)).toEqual(['المقاس'])
  })
})
