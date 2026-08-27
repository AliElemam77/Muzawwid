import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  extractImageUrls,
  hasGallery,
  detectProductUrlColumn,
  rowsMissingImages,
  currentImages,
  tasksFor,
  fetchProductImages,
  scrapeImages,
  resetPacers,
} from './scrape'
import { emptyConfig } from './types'
import type { SourceSheet } from './reader'
import { F } from './salla'

const CDN = 'https://cdn.salla.sa/yzaOx'

/**
 * Shaped after a real techtimesa.com product page: the big slider lazy-loads
 * every slide past the first behind `s-empty.png`, while the thumbs strip
 * carries the real `src`.
 */
function page({
  images,
  lazyFrom = 1,
  withThumbs = true,
  ogImage = '',
}: {
  images: string[]
  lazyFrom?: number
  withThumbs?: boolean
  ogImage?: string
}): string {
  const items = images
    .map(
      (url, i) => `
      <a data-fslightbox="product_1" data-type="image" href="${url}" class="swiper-slide">
        <img id="img${i}" ${
          i >= lazyFrom
            ? `src="https://cdn.salla.network/images/s-empty.png?v=2.0.5" data-src="${url}" class="lazy"`
            : `src="${url}"`
        } alt="p">
      </a>`,
    )
    .join('')
  const thumbs = images
    .map((url) => `<div class="slide--one-fourth"><img src="${url}" title="p" alt="p"></div>`)
    .join('')

  return `<!DOCTYPE html><html><head>
    ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ''}
  </head><body>
    <salla-slider id="products-slider-related" type="card">
      <div slot="items"><a href="${CDN}/RELATED-do-not-pick.jpg" data-type="image"></a></div>
    </salla-slider>
    <salla-slider id="details-slider-2069148024" class="details-slider" type="thumbs" loop="false">
      <div slot="items">${items}</div>
      ${withThumbs ? `<div slot="thumbs">${thumbs}</div>` : ''}
    </salla-slider>
  </body></html>`
}

describe('extractImageUrls', () => {
  it('returns every gallery image, in order', () => {
    const urls = [
      `${CDN}/02964fb6-82ba-4969-8b59-dc1d8cf5ff7a-1000x1000-K7n4lCG7NcOKpA9mO6Rh6AlqAcoR2gg4JlveDZwz.jpg`,
      `${CDN}/3c76a3aa-1924-4ae2-b1b3-a5f073063da7-1000x1000-NYnN6pwYydOMWNfB2p12ehjbrx19YzyEEEl3EWzX.jpg`,
      `${CDN}/038d0f7f-c4b2-409f-9324-9dc04a094803-1000x1000-ST4D7Rj6JV9XL9ww3Nuis7duieTAwZuNKumby9CR.jpg`,
      `${CDN}/f2c7d7cc-7892-4d6a-8566-9389d2806aa1-1000x1000-zykLyyph51bOZO1MQG8Whv0X5VNKOED3uy5pTS6v.jpg`,
    ]
    expect(extractImageUrls(page({ images: urls }))).toEqual(urls)
  })

  it('makes no assumption about the URL shape — same store, no size segment', () => {
    // This product really exists and its images carry no `-1000x1000-` part;
    // pattern-matching the URL instead of reading `src` would return nothing.
    const urls = [
      `${CDN}/H8QlSP4yjtuaOCAZpFUL91rnv83zvy0kFxBbj9NE.jpg`,
      `${CDN}/PBe90VpJ6s0lw87Bc58gTTk00ryV3sbvDyE7w9m2.jpg`,
      `${CDN}/Ol5vmRRQBajMzn69BCS3njFEIU6WKFfZMnSMv4Ew.jpg`,
    ]
    expect(extractImageUrls(page({ images: urls }))).toEqual(urls)
  })

  it('never returns the lazy-loading placeholder', () => {
    const urls = [`${CDN}/a.jpg`, `${CDN}/b.jpg`, `${CDN}/c.jpg`]
    const html = page({ images: urls, withThumbs: false })
    expect(html).toContain('s-empty.png')
    expect(extractImageUrls(html)).toEqual(urls)
  })

  it('reads a single-image product that has no thumbs strip', () => {
    const urls = [`${CDN}/only.jpg`]
    expect(extractImageUrls(page({ images: urls, withThumbs: false }))).toEqual(urls)
  })

  it('ignores og:image — stores set a social image that is not a product photo', () => {
    const urls = [`${CDN}/H8QlSP4yjtua.jpg`, `${CDN}/PBe90VpJ6s0l.jpg`]
    const html = page({ images: urls, ogImage: `${CDN}/ukqSxHjhnrt4Dx9UMN52ohY2kdt0FImR.jpg` })
    expect(extractImageUrls(html)).toEqual(urls)
  })

  it('ignores sliders that are not the product gallery', () => {
    const out = extractImageUrls(page({ images: [`${CDN}/a.jpg`] }))
    expect(out.some((u) => u.includes('RELATED'))).toBe(false)
  })

  it('de-duplicates the clones Swiper adds in loop mode', () => {
    const url = `${CDN}/a.jpg`
    const slide = `<div class="swiper-slide swiper-slide-duplicate"><img src="${url}"></div>`
    const html = `<salla-slider id="details-slider-1" type="thumbs">
      <div slot="items"><a data-type="image" href="${url}"><img src="${url}"></a></div>
      <div slot="thumbs">${slide}${slide}${slide}</div>
    </salla-slider>`
    expect(extractImageUrls(html)).toEqual([url])
  })

  it('keeps the full list when a theme renders fewer thumbs than slides', () => {
    const urls = [`${CDN}/a.jpg`, `${CDN}/b.jpg`, `${CDN}/c.jpg`]
    const html = `<salla-slider id="details-slider-1" type="thumbs">
      <div slot="items">${urls
        .map((u) => `<a data-type="image" href="${u}"><img src="${u}"></a>`)
        .join('')}</div>
      <div slot="thumbs"><div><img src="${urls[0]}"></div></div>
    </salla-slider>`
    expect(extractImageUrls(html)).toEqual(urls)
  })

  it('decodes entities and absolutises protocol-relative links', () => {
    const html = `<salla-slider id="details-slider-1">
      <div slot="items">
        <a data-type="image" href="//cdn.salla.sa/x/a.jpg?w=1&amp;h=2"><img src="//cdn.salla.sa/x/a.jpg?w=1&amp;h=2"></a>
      </div>
    </salla-slider>`
    expect(extractImageUrls(html)).toEqual(['https://cdn.salla.sa/x/a.jpg?w=1&h=2'])
  })

  it('returns nothing for a page with no product slider', () => {
    expect(hasGallery('<html><body>404</body></html>')).toBe(false)
    expect(extractImageUrls('<html><body><img src="https://x.test/a.jpg"></body></html>')).toEqual([])
  })
})

// --- Reading the sheet ------------------------------------------------------

function sheet(rows: Record<string, string>[]): SourceSheet {
  return { name: 'Sheet1', headers: Object.keys(rows[0] ?? {}), rows }
}

describe('detectProductUrlColumn', () => {
  it('finds the product-page column by content, whatever it is called', () => {
    const s = sheet([
      { الاسم: 'منتج ١', 'عمود 3': 'https://techtimesa.com/a/p1', صورة: '' },
      { الاسم: 'منتج ٢', 'عمود 3': 'https://techtimesa.com/b/p2', صورة: '' },
    ])
    expect(detectProductUrlColumn(s)).toBe('عمود 3')
  })

  it('prefers a url-ish header when two columns both hold page links', () => {
    const s = sheet([
      { مصدر: 'https://ref.test/a', 'رابط المنتج': 'https://techtimesa.com/a/p1' },
      { مصدر: 'https://ref.test/b', 'رابط المنتج': 'https://techtimesa.com/b/p2' },
    ])
    expect(detectProductUrlColumn(s)).toBe('رابط المنتج')
  })

  it('does not mistake an image column for the product page', () => {
    const s = sheet([
      { image: `${CDN}/a.jpg`, name: 'x' },
      { image: `${CDN}/b.jpg`, name: 'y' },
    ])
    expect(detectProductUrlColumn(s)).toBe('')
  })
})

describe('rowsMissingImages', () => {
  it('flags the rows whose image cell is empty', () => {
    const config = { ...emptyConfig(), imageColumns: ['صورة'] }
    const s = sheet([
      { صورة: `${CDN}/a.jpg`, رابط: 'https://t.test/p1' },
      { صورة: '', رابط: 'https://t.test/p2' },
    ])
    expect(rowsMissingImages(s, config)).toEqual([1])
  })

  it('counts a product-PAGE link sitting in the image column as missing', () => {
    // Exactly what a scraper leaves behind, and the reason this feature exists.
    const config = { ...emptyConfig(), imageColumns: ['صورة'] }
    const s = sheet([{ صورة: 'https://techtimesa.com/product/p1', رابط: 'https://t.test/p1' }])
    expect(rowsMissingImages(s, config)).toEqual([0])
  })

  it('skips blank rows', () => {
    const config = { ...emptyConfig(), imageColumns: ['صورة'] }
    expect(rowsMissingImages(sheet([{ صورة: '', رابط: '' }]), config)).toEqual([])
  })

  it('reads a singly-mapped image field when no merge columns are set', () => {
    const config = emptyConfig()
    config.fields[F.image] = { kind: 'column', column: 'pic' }
    const s = sheet([
      { الاسم: 'منتج ١', pic: `${CDN}/a.jpg` },
      { الاسم: 'منتج ٢', pic: '' },
    ])
    expect(currentImages(s.rows[0], config)).toEqual([`${CDN}/a.jpg`])
    expect(rowsMissingImages(s, config)).toEqual([1])
  })
})

// --- Fetching ---------------------------------------------------------------

/** Stand in for a proxy response. */
function reply(status: number, body = '', headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    text: async () => body,
  } as unknown as Response
}

const GALLERY = `<salla-slider id="details-slider-1" type="thumbs">
  <div slot="thumbs"><div><img src="${CDN}/a.jpg"></div></div>
</salla-slider>`

// The pacer is shared process-wide, so without this the file's ~15 stubbed
// requests eat one real 20-per-minute budget and later tests start waiting.
beforeEach(() => resetPacers())
afterEach(() => vi.unstubAllGlobals())

describe('fetchProductImages', () => {
  it('waits out a 429 and retries the SAME proxy', async () => {
    // The free jina tier allows 20 requests/60s; being throttled part-way
    // through a real sheet is normal, not a failure.
    const calls: string[] = []
    let n = 0
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(url)
      return ++n <= 2 ? reply(429, '', { 'retry-after': '2' }) : reply(200, GALLERY)
    })

    vi.useFakeTimers()
    try {
      const pending = fetchProductImages('https://t.test/p1')
      await vi.runAllTimersAsync()
      expect(await pending).toEqual([`${CDN}/a.jpg`])
    } finally {
      vi.useRealTimers()
    }

    expect(calls).toHaveLength(3)
    // All three went to jina — a rate limit must not demote us to a weaker proxy.
    expect(calls.every((u) => u.startsWith('https://r.jina.ai/'))).toBe(true)
  })

  it('gives up on a proxy that stays throttled instead of retrying forever', async () => {
    const calls: string[] = []
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(url)
      return reply(429, '', { 'retry-after': '2' })
    })

    vi.useFakeTimers()
    try {
      const pending = fetchProductImages('https://t.test/p1')
      const settled = expect(pending).rejects.toThrow(/HTTP 429/)
      await vi.runAllTimersAsync()
      await settled
    } finally {
      vi.useRealTimers()
    }
    // Bounded: 5 tries per proxy across all three, never an endless loop.
    expect(calls).toHaveLength(15)
  })

  it('moves to the next proxy on a real error, not on a 429', async () => {
    const calls: string[] = []
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(url)
      return url.startsWith('https://r.jina.ai/') ? reply(500) : reply(200, GALLERY)
    })

    expect(await fetchProductImages('https://t.test/p1')).toEqual([`${CDN}/a.jpg`])
    expect(calls).toHaveLength(2)
    expect(calls[1]).toContain('allorigins')
  })

  it('treats a 200 that is not a product page as a failed proxy', async () => {
    // allorigins has served cached error shells with a 200 — reporting that as
    // "this product has no images" would silently lose the product's gallery.
    vi.stubGlobal('fetch', async () => reply(200, '<html><body>whoops</body></html>'))
    await expect(fetchProductImages('https://t.test/p1')).rejects.toThrow(/not a product page/)
  })

  it('keeps the good rows when one page fails', async () => {
    vi.stubGlobal('fetch', async (url: string) =>
      url.includes('p2') ? reply(404) : reply(200, GALLERY),
    )
    const out = await scrapeImages(
      [
        { rowIndex: 0, url: 'https://t.test/p1' },
        { rowIndex: 1, url: 'https://t.test/p2' },
      ],
      { concurrency: 2 },
    )
    expect(out[0].images).toEqual([`${CDN}/a.jpg`])
    expect(out[1].images).toEqual([])
    expect(out[1].error).toBeTruthy()
  })

  it('reports progress once per page and returns results in row order', async () => {
    vi.stubGlobal('fetch', async () => reply(200, GALLERY))
    const seen: number[] = []
    const out = await scrapeImages(
      [3, 1, 2].map((rowIndex) => ({ rowIndex, url: `https://t.test/p${rowIndex}` })),
      { concurrency: 3, onProgress: (done) => seen.push(done) },
    )
    expect(seen).toEqual([1, 2, 3])
    expect(out.map((r) => r.rowIndex)).toEqual([1, 2, 3])
  })
})

describe('tasksFor', () => {
  it('keeps only rows that actually have a link to visit', () => {
    const s = sheet([
      { رابط: 'https://t.test/p1' },
      { رابط: '' },
      { رابط: 'not a url' },
      { رابط: 'https://t.test/p4' },
    ])
    expect(tasksFor(s, 'رابط', [0, 1, 2, 3])).toEqual([
      { rowIndex: 0, url: 'https://t.test/p1' },
      { rowIndex: 3, url: 'https://t.test/p4' },
    ])
  })
})
