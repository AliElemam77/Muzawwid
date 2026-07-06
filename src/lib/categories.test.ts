import { describe, it, expect } from 'vitest'
import { normalizeCategories, splitCategoryInput } from './categories'

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
