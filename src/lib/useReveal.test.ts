import { describe, it, expect } from 'vitest'
import { scopedSelector } from './useReveal'

describe('scopedSelector', () => {
  // `querySelectorAll('> *')` throws a SyntaxError — a selector may not start
  // with a combinator. This is the exact crash this helper exists to prevent.
  it('scopes a selector that starts with a combinator', () => {
    expect(scopedSelector('> *')).toBe(':scope > *')
    expect(scopedSelector('>*')).toBe(':scope >*')
    expect(scopedSelector('+ div')).toBe(':scope + div')
    expect(scopedSelector('~ p')).toBe(':scope ~ p')
  })

  it('leaves an ordinary descendant selector alone', () => {
    expect(scopedSelector('.card')).toBe('.card')
    expect(scopedSelector('section > div')).toBe('section > div')
    expect(scopedSelector('[data-reveal]')).toBe('[data-reveal]')
  })

  it('tolerates surrounding whitespace', () => {
    expect(scopedSelector('  > *  ')).toBe(':scope > *')
    expect(scopedSelector('  .card ')).toBe('.card')
  })
})
