import { describe, it, expect } from 'vitest'
import { buildProducts } from './product'
import { emptyConfig } from './types'
import { F } from './salla'
import type { SourceSheet } from './reader'

function sheet(headers: string[], rows: Record<string, string>[]): SourceSheet {
  return { name: 'Sheet1', headers, rows }
}

describe('buildProducts — product page URL split', () => {
  it('moves a leading non-image URL out of images into productPageUrl', () => {
    const s = sheet(
      ['img'],
      [{ img: 'https://shop.example/ar/shoe/p123, https://cdn.x/a.jpg, https://cdn.x/b.jpg' }],
    )
    const config = emptyConfig()
    config.imageColumns = ['img']

    const [p] = buildProducts(s, config)
    expect(p.productPageUrl).toBe('https://shop.example/ar/shoe/p123')
    expect(p.images).toEqual(['https://cdn.x/a.jpg', 'https://cdn.x/b.jpg'])
  })

  it('keeps images intact when the first entry is a real image file', () => {
    const s = sheet(['img'], [{ img: 'https://cdn.x/a.jpg, https://cdn.x/b.png' }])
    const config = emptyConfig()
    config.imageColumns = ['img']

    const [p] = buildProducts(s, config)
    expect(p.productPageUrl).toBe('')
    expect(p.images).toEqual(['https://cdn.x/a.jpg', 'https://cdn.x/b.png'])
  })
})

describe('buildProducts — quantity & price rules', () => {
  it('applies infinite quantity and a sale_price = price − 10% rule to every product', () => {
    const s = sheet(['name', 'price'], [{ name: 'قميص', price: '100' }])
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'name' }
    config.fields[F.price] = { kind: 'column', column: 'price' }
    config.quantity = { mode: 'infinite', value: '' }
    config.priceRules = [{ target: 'salePrice', source: 'price', op: 'percentOff', value: '10' }]

    const [p] = buildProducts(s, config)
    expect(p.quantity).toBe('infinite')
    expect(p.price).toBe('100')
    expect(p.salePrice).toBe('90')
  })

  it('writes a fixed quantity to every product', () => {
    const s = sheet(['name'], [{ name: 'أ' }, { name: 'ب' }])
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'column', column: 'name' }
    config.quantity = { mode: 'fixed', value: '250' }

    const products = buildProducts(s, config)
    expect(products.map((p) => p.quantity)).toEqual(['250', '250'])
  })
})

describe('buildProducts — option name sanitization', () => {
  it('rewrites a selector-like option column name to a human name', () => {
    const s = sheet(
      ['s-product-options-grid-mode-span'],
      [{ 's-product-options-grid-mode-span': '52, 54, 58' }],
    )
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'constant', value: 'حذاء' }
    config.options = [{ column: 's-product-options-grid-mode-span', name: 's-product-options-grid-mode-span', type: 'text' }]

    const [p] = buildProducts(s, config)
    expect(p.options).toHaveLength(1)
    expect(p.options[0].nameAr).toBe('الخيار') // never the raw selector
    expect(p.options[0].values).toEqual(['52', '54', '58'])
  })

  it('merges two columns mapped with the SAME option name into ONE option (52, 54)', () => {
    const s = sheet(['size1', 'size2'], [{ size1: '52', size2: '54' }])
    const config = emptyConfig()
    config.fields[F.name] = { kind: 'constant', value: 'حذاء' }
    config.options = [
      { column: 'size1', name: 'المقاس', type: 'text' },
      { column: 'size2', name: 'المقاس', type: 'text' },
    ]

    const [p] = buildProducts(s, config)
    expect(p.options).toHaveLength(1) // NOT two separate single-value options
    expect(p.options[0].nameAr).toBe('المقاس')
    expect(p.options[0].values).toEqual(['52', '54'])
  })
})
