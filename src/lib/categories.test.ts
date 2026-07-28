import { describe, it, expect } from 'vitest'
import {
  normalizeCategories,
  splitCategoryInput,
  normalizeCategoryField,
  parseCategoryCell,
  formatCategoryCell,
  dropCoveredAncestors,
  buildCategoryTree,
  flattenCategoryTree,
  addCategoryPath,
  removeCategoryPath,
  parentPathOf,
} from './categories'

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

describe('parseCategoryCell — sub-levels and multiple categories', () => {
  it('splits levels on `>` no matter the spacing', () => {
    expect(parseCategoryCell('ملابس>رجالي')).toEqual([['ملابس', 'رجالي']])
    expect(parseCategoryCell('ملابس   >   رجالي')).toEqual([['ملابس', 'رجالي']])
    expect(normalizeCategoryField('ملابس>رجالي')).toBe('ملابس > رجالي')
    expect(normalizeCategoryField('ملابس   >   رجالي')).toBe('ملابس > رجالي')
  })

  it('supports unbounded depth — the official template ships a 3-level example', () => {
    expect(parseCategoryCell('ملابس > نسائية > بناتي')).toEqual([
      ['ملابس', 'نسائية', 'بناتي'],
    ])
    expect(parseCategoryCell('أ > ب > ج > د > و')).toEqual([['أ', 'ب', 'ج', 'د', 'و']])
  })

  it('a comma separates independent categories, an arrow separates levels', () => {
    expect(parseCategoryCell('نسائي > عبايات , اعياد')).toEqual([
      ['نسائي', 'عبايات'],
      ['اعياد'],
    ])
    expect(normalizeCategoryField('نسائي > عبايات , اعياد')).toBe('نسائي > عبايات, اعياد')
  })

  it('accepts the Arabic comma ، exactly like `,`', () => {
    expect(parseCategoryCell('نسائي > عبايات ، اعياد')).toEqual(
      parseCategoryCell('نسائي > عبايات , اعياد'),
    )
  })

  it('accepts mirrored arrows — RTL editors flip how `>` looks while typing', () => {
    expect(parseCategoryCell('ملابس ‹ رجالي')).toEqual([['ملابس', 'رجالي']])
    expect(parseCategoryCell('ملابس < رجالي')).toEqual([['ملابس', 'رجالي']])
    expect(normalizeCategoryField('ملابس ‹ رجالي')).toBe('ملابس > رجالي')
  })

  it('drops empty levels and empty paths', () => {
    expect(parseCategoryCell('ملابس >  > رجالي')).toEqual([['ملابس', 'رجالي']])
    expect(parseCategoryCell('> ملابس')).toEqual([['ملابس']])
    expect(parseCategoryCell('نسائي , , اعياد')).toEqual([['نسائي'], ['اعياد']])
  })

  it('strips tatweel and zero-width / bidi marks, collapses inner whitespace', () => {
    const ZWSP = String.fromCharCode(0x200b)
    const RLM = String.fromCharCode(0x200f)
    const BOM = String.fromCharCode(0xfeff)
    const TATWEEL = String.fromCharCode(0x0640)
    expect(parseCategoryCell(`${BOM}ملا${TATWEEL}بس ${ZWSP}>${RLM} رجالي`)).toEqual([
      ['ملابس', 'رجالي'],
    ])
    expect(parseCategoryCell('ملابس   رجالية')).toEqual([['ملابس رجالية']])
  })

  it('leaves a plain single category exactly as it is today', () => {
    expect(parseCategoryCell('عبايات')).toEqual([['عبايات']])
    expect(normalizeCategoryField('عبايات')).toBe('عبايات')
    expect(normalizeCategoryField('  عبايات  ')).toBe('عبايات')
  })

  it('an empty cell means no categories — not an error, not a warning', () => {
    expect(parseCategoryCell('')).toEqual([])
    expect(parseCategoryCell('   ')).toEqual([])
    expect(parseCategoryCell(' , ، > ')).toEqual([])
    expect(normalizeCategoryField('')).toBe('')
  })
})

describe('formatCategoryCell', () => {
  it('joins levels with ` > ` and categories with `, `', () => {
    expect(
      formatCategoryCell([
        ['ملابس', 'نسائية', 'بناتي'],
        ['اعياد'],
      ]),
    ).toBe('ملابس > نسائية > بناتي, اعياد')
    expect(formatCategoryCell([])).toBe('')
  })

  it('round-trips a parsed cell', () => {
    const raw = 'نسائي>عبايات ، ملابس ‹ رجالي'
    expect(formatCategoryCell(parseCategoryCell(raw))).toBe(normalizeCategoryField(raw))
    expect(formatCategoryCell(parseCategoryCell(raw))).toBe('نسائي > عبايات, ملابس > رجالي')
  })
})

describe('category tree — nesting without typing `>`', () => {
  const list = ['ملابس', 'ملابس > رجالي', 'ملابس > نسائية', 'ملابس > نسائية > بناتي', 'اعياد']

  it('builds the nesting tree, labels showing only the last level', () => {
    const tree = buildCategoryTree(list)
    expect(tree.map((n) => n.label)).toEqual(['ملابس', 'اعياد'])
    expect(tree[0].children.map((n) => n.label)).toEqual(['رجالي', 'نسائية'])
    expect(tree[0].children[1].children.map((n) => n.path)).toEqual([
      'ملابس > نسائية > بناتي',
    ])
    expect(tree[0].children[1].children[0].depth).toBe(2)
  })

  it('synthesizes a missing ancestor so nothing is orphaned', () => {
    const tree = buildCategoryTree(['ملابس > رجالي'])
    expect(tree.map((n) => n.path)).toEqual(['ملابس'])
    expect(tree[0].children.map((n) => n.path)).toEqual(['ملابس > رجالي'])
  })

  it('flattens depth-first — children always follow their parent', () => {
    expect(flattenCategoryTree(buildCategoryTree(list)).map((n) => n.path)).toEqual([
      'ملابس',
      'ملابس > رجالي',
      'ملابس > نسائية',
      'ملابس > نسائية > بناتي',
      'اعياد',
    ])
  })

  it('addCategoryPath composes the `>` path from the parent the user clicked', () => {
    expect(addCategoryPath(['ملابس'], 'ملابس', 'رجالي')).toEqual(['ملابس', 'ملابس > رجالي'])
    // several siblings at once, comma-separated
    expect(addCategoryPath([], '', 'ملابس، اعياد')).toEqual(['ملابس', 'اعياد'])
    // nesting under a synthesized ancestor makes that ancestor real
    expect(addCategoryPath([], 'ملابس', 'رجالي')).toEqual(['ملابس', 'ملابس > رجالي'])
    // depth is unbounded
    expect(addCategoryPath(list, 'ملابس > نسائية > بناتي', 'شتوي')).toContain(
      'ملابس > نسائية > بناتي > شتوي',
    )
  })

  it('addCategoryPath is idempotent and keeps children after their parent', () => {
    const once = addCategoryPath(list, 'ملابس', 'رجالي')
    expect(once).toEqual(flattenCategoryTree(buildCategoryTree(list)).map((n) => n.path))
  })

  it('removeCategoryPath drops the category AND everything nested in it', () => {
    expect(removeCategoryPath(list, 'ملابس > نسائية')).toEqual([
      'ملابس',
      'ملابس > رجالي',
      'اعياد',
    ])
    expect(removeCategoryPath(list, 'ملابس')).toEqual(['اعياد'])
    // a sibling with a shared prefix is NOT dragged along
    expect(removeCategoryPath(['ملابس', 'ملابسي'], 'ملابس')).toEqual(['ملابسي'])
  })

  it('parentPathOf returns the containing category, or "" at top level', () => {
    expect(parentPathOf('ملابس > نسائية > بناتي')).toBe('ملابس > نسائية')
    expect(parentPathOf('ملابس')).toBe('')
  })

  it('a picked set round-trips through the exported cell shape', () => {
    const picked = ['ملابس > نسائية > بناتي', 'اعياد']
    const cell = formatCategoryCell(picked.map((p) => p.split(' > ')))
    expect(cell).toBe('ملابس > نسائية > بناتي, اعياد')
    expect(parseCategoryCell(cell).map((l) => l.join(' > '))).toEqual(picked)
  })
})

describe('a chosen sub-category supersedes its parent', () => {
  const paths = (cell: string) => parseCategoryCell(cell).map((l) => l.join(' > '))

  it('drops the parent when a sub-category under it is also picked', () => {
    expect(
      dropCoveredAncestors(paths('الكترونيات, الكترونيات > موبيل').map((p) => p.split(' > '))),
    ).toEqual([['الكترونيات', 'موبيل']])
    expect(normalizeCategoryField('الكترونيات, الكترونيات > موبيل')).toBe(
      'الكترونيات > موبيل',
    )
    // order in the cell does not matter
    expect(normalizeCategoryField('الكترونيات > موبيل، الكترونيات')).toBe(
      'الكترونيات > موبيل',
    )
  })

  it('drops every ancestor level, not just the immediate parent', () => {
    expect(
      normalizeCategoryField('ملابس, ملابس > نسائية, ملابس > نسائية > بناتي'),
    ).toBe('ملابس > نسائية > بناتي')
  })

  it('keeps siblings — only ancestors are covered', () => {
    expect(normalizeCategoryField('الكترونيات > موبيل، الكترونيات > لابتوب')).toBe(
      'الكترونيات > موبيل, الكترونيات > لابتوب',
    )
  })

  it('keeps an unrelated category that merely shares a name prefix', () => {
    expect(normalizeCategoryField('ملابس, ملابسي > رجالي')).toBe('ملابس, ملابسي > رجالي')
  })

  it('leaves a lone parent alone when no sub-category is picked', () => {
    expect(normalizeCategoryField('الكترونيات')).toBe('الكترونيات')
    expect(normalizeCategoryField('الكترونيات، اعياد')).toBe('الكترونيات, اعياد')
  })

  it('does NOT prune the store category list — both stay pickable', () => {
    expect(normalizeCategories(['الكترونيات', 'الكترونيات > موبيل'])).toEqual([
      'الكترونيات',
      'الكترونيات > موبيل',
    ])
  })
})
