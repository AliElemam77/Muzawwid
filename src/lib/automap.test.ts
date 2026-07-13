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
