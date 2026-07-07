import { describe, it, expect } from 'vitest'
import { autoMap } from './automap'
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

  it('collapses same-named option columns into one (no option1/2/3 blow-up)', () => {
    const s = sheet(
      ['size', 'size (2)', 'size (3)'],
      [{ size: 'S', 'size (2)': 'M', 'size (3)': 'L' }],
    )
    const config = autoMap(s)
    expect(config.options).toHaveLength(1)
    expect(config.options[0].name).toBe('المقاس')
  })

  it('drops an all-identical column (no real variance)', () => {
    const s = sheet(
      ['size'],
      [{ size: 'M' }, { size: 'M' }, { size: 'M' }],
    )
    expect(autoMap(s).options).toHaveLength(0)
  })
})
