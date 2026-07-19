import { describe, it, expect } from 'vitest'
import { applyPriceRules, resolveQuantity, type Prices } from './pricing'
import type { PriceRule } from './types'

const base: Prices = { price: '100', salePrice: '', cost: '' }

describe('resolveQuantity', () => {
  it('keeps the source value in source mode', () => {
    expect(resolveQuantity('7', { mode: 'source', value: '' })).toBe('7')
    expect(resolveQuantity('', { mode: 'source', value: '' })).toBe('')
  })
  it('writes the literal "infinite"', () => {
    expect(resolveQuantity('7', { mode: 'infinite', value: '' })).toBe('infinite')
  }) 
  it('writes the configured fixed number (trimmed)', () => {
    expect(resolveQuantity('7', { mode: 'fixed', value: ' 100 ' })).toBe('100')
  })
  it('is safe when the config is missing', () => {
    expect(resolveQuantity('5', undefined)).toBe('5')
  })
})

describe('applyPriceRules', () => {
  it('derives sale_price as a percent off the price', () => {
    const rules: PriceRule[] = [
      { target: 'salePrice', source: 'price', op: 'percentOff', value: '10' },
    ]
    expect(applyPriceRules(base, rules).salePrice).toBe('90')
  })

  it('derives cost as a percent of the price', () => {
    const rules: PriceRule[] = [
      { target: 'cost', source: 'price', op: 'percentOf', value: '60' },
    ]
    expect(applyPriceRules(base, rules).cost).toBe('60')
  })

  it('supports ×, +, − operators', () => {
    expect(
      applyPriceRules(base, [{ target: 'salePrice', source: 'price', op: 'multiply', value: '0.8' }]).salePrice,
    ).toBe('80')
    expect(
      applyPriceRules(base, [{ target: 'cost', source: 'price', op: 'add', value: '5' }]).cost,
    ).toBe('105')
    expect(
      applyPriceRules(base, [{ target: 'salePrice', source: 'price', op: 'subtract', value: '15' }]).salePrice,
    ).toBe('85')
  })

  it('applies rules in order so a later rule can read an earlier result', () => {
    const rules: PriceRule[] = [
      { target: 'salePrice', source: 'price', op: 'percentOff', value: '20' }, // 80
      { target: 'cost', source: 'salePrice', op: 'percentOff', value: '50' }, // 40
    ]
    const out = applyPriceRules(base, rules)
    expect(out.salePrice).toBe('80')
    expect(out.cost).toBe('40')
  })

  it('rounds to 2 decimals and drops trailing zeros', () => {
    const out = applyPriceRules({ price: '99.99', salePrice: '', cost: '' }, [
      { target: 'salePrice', source: 'price', op: 'percentOff', value: '13' },
    ])
    expect(out.salePrice).toBe('86.99') // 99.99 × 0.87 = 86.9913 → 86.99
  })

  it('clamps negative results to 0', () => {
    const out = applyPriceRules(base, [
      { target: 'salePrice', source: 'price', op: 'subtract', value: '250' },
    ])
    expect(out.salePrice).toBe('0')
  })

  it('skips a rule whose source or value is non-numeric (leaves field intact)', () => {
    const out = applyPriceRules({ price: '', salePrice: 'keep', cost: '' }, [
      { target: 'salePrice', source: 'price', op: 'percentOff', value: '10' },
    ])
    expect(out.salePrice).toBe('keep')
  })

  it('returns the base unchanged when there are no rules', () => {
    expect(applyPriceRules(base)).toEqual(base)
  })
})
