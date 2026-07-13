import { describe, it, expect } from 'vitest'
import { normalizeCategories, splitCategoryInput, normalizeCategoryField } from './categories'

describe('categories helpers', () => {
  it('normalizeCategories trims, drops empties, de-dupes (order kept)', () => {
    expect(normalizeCategories(['  قمصان ', 'بناطيل', '', 'قمصان', ' '])).toEqual([
      'قمصان',
      'بناطيل',
    ])
  })

  it('splitCategoryInput splits pasted text on comma / Arabic comma / newline / pipe', () => {
    expect(splitCategoryInput('قمصان، بناطيل\nأحذية | قمصان')).toEqual([
      'قمصان',
      'بناطيل',
      'أحذية',
    ])
    expect(splitCategoryInput('   ')).toEqual([])
  })
})

describe('normalizeCategoryField — Salla/Zid category shape', () => {
  it('keeps a well-formed single hierarchy path (Salla example)', () => {
    expect(normalizeCategoryField('ملابس > نسائية > بناتي')).toBe('ملابس > نسائية > بناتي')
  })

  it('adds spaces around a tight `>` separator', () => {
    expect(normalizeCategoryField('ملابس>نسائية>بناتي')).toBe('ملابس > نسائية > بناتي')
  })

  it('normalizes multiple categories with a `, ` separator (Zid example)', () => {
    expect(normalizeCategoryField('حقائب>حقائب ظهر,عروض')).toBe('حقائب > حقائب ظهر, عروض')
    expect(normalizeCategoryField('حقائب › حقائب ظهر،  عروض')).toBe('حقائب > حقائب ظهر, عروض')
  })

  it('treats guillemets › » as level separators', () => {
    expect(normalizeCategoryField('A › B » C')).toBe('A > B > C')
  })

  it('drops empty levels/paths and de-dupes paths (order kept)', () => {
    expect(normalizeCategoryField('X > , X , , Y')).toBe('X, Y')
    expect(normalizeCategoryField('  ')).toBe('')
    expect(normalizeCategoryField('')).toBe('')
  })
})
