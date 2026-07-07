import { describe, it, expect } from 'vitest'
import { seoTitle, metaDescription, keywords } from './generate'

describe('seoTitle', () => {
  it('keeps short names, trims long ones on a word boundary within 60 chars', () => {
    expect(seoTitle('عباية سوداء كلوش')).toBe('عباية سوداء كلوش')
    const long = 'عباية سوداء كلوش فاخرة بقصة واسعة وخامة كريب ممتازة مناسبة لكل المناسبات الرسمية'
    const out = seoTitle(long)
    expect(out.length).toBeLessThanOrEqual(60)
    expect(out.endsWith(' ')).toBe(false)
  })
})

describe('metaDescription', () => {
  it('builds a sentence from name + category + brand, capped at ~155 chars', () => {
    const m = metaDescription('عباية سوداء كلوش', 'ملابس>عبايات', 'دار الأناقة')
    expect(m).toContain('عباية سوداء كلوش')
    expect(m).toContain('عبايات') // leaf category
    expect(m).toContain('دار الأناقة')
    expect(m.length).toBeLessThanOrEqual(155)
  })
  it('is empty for an empty name', () => {
    expect(metaDescription('')).toBe('')
  })
})

describe('keywords', () => {
  it('tokenizes name + brand + category, dedupes case-insensitively', () => {
    const k = keywords('عباية سوداء', 'أناقة', 'ملابس>عبايات')
    const list = k.split(', ')
    expect(list).toContain('عباية')
    expect(list).toContain('سوداء')
    expect(list).toContain('عبايات')
    expect(new Set(list).size).toBe(list.length) // no duplicates
  })
})
