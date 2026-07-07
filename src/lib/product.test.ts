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
})
