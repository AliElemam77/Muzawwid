/**
 * Fill in the images a scraper left behind.
 *
 * Tools like Easy Scraper read a Salla product page AFTER the browser has
 * painted it, so they capture the one visible image and miss the rest of the
 * gallery. The images are all present in the page's server-rendered HTML
 * though, so a plain HTTP GET + a parse of `<salla-slider>` recovers them —
 * no headless browser needed.
 *
 * Nothing here assumes anything about the SHAPE of an image URL. Two products
 * from the same store can look completely different:
 *
 *     …/02964fb6-…-1000x1000-K7n4lCG7….jpg     ← has a size segment
 *     …/H8QlSP4yjtuaOCAZpFUL91rnv83zvy0k.jpg   ← has none
 *
 * so we only ever take what the markup gives us, verbatim.
 */

import { splitValues } from './build'
import { classifyUrl, isImageUrl } from './urls'
import type { SourceRow, SourceSheet } from './reader'
import type { MappingConfig } from './types'
import { F } from './salla'

// --- HTML parsing -----------------------------------------------------------
// Regex rather than DOMParser on purpose: this module is unit-tested under the
// plain `node` Vitest environment, where DOMParser does not exist.

/** Salla's 1×1 stand-in that sits in `src` until the lazy loader swaps it in. */
const PLACEHOLDER_RE = /(^|\/)s-empty\.[a-z0-9]+/i

/** Attribute holding the real URL, in the order we trust them. */
const SRC_ATTRS = ['data-src', 'data-lazy-src', 'data-original', 'src']

function attr(tag: string, name: string): string {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))
  return m ? m[1] : ''
}

/** `&amp;` → `&`, and protocol-relative `//host/…` → `https://host/…`. */
function normalizeUrl(raw: string): string {
  const v = raw
    .trim()
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
  return v.startsWith('//') ? `https:${v}` : v
}

function dedupe(urls: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of urls) {
    const url = normalizeUrl(raw)
    if (!url || PLACEHOLDER_RE.test(url) || !/^https?:\/\//i.test(url)) continue
    if (seen.has(url)) continue
    seen.add(url)
    out.push(url)
  }
  return out
}

function imgUrls(block: string): string[] {
  const out: string[] = []
  for (const tag of block.match(/<img\b[^>]*>/gi) ?? []) {
    const src = SRC_ATTRS.map((a) => attr(tag, a)).find((v) => v && !PLACEHOLDER_RE.test(v))
    if (src) out.push(src)
  }
  return out
}

/**
 * The full-size links behind each slide. Restricted to the lightbox anchors
 * (`data-fslightbox` / `data-type="image"`) so ordinary links that happen to
 * sit inside the slider never leak into the gallery.
 */
function lightboxUrls(block: string): string[] {
  const out: string[] = []
  for (const tag of block.match(/<a\b[^>]*>/gi) ?? []) {
    if (!/\bdata-fslightbox\b/i.test(tag) && !/\bdata-type\s*=\s*["']image["']/i.test(tag)) continue
    const href = attr(tag, 'href')
    if (href) out.push(href)
  }
  return out
}

/** Cheap check that a response really is a Salla product page. */
export function hasGallery(html: string): boolean {
  return /<salla-slider\b/i.test(html)
}

/**
 * The product gallery's `<salla-slider>` body, or '' when the page has none.
 *
 * A page carries several sliders (related products, recently viewed…). The
 * product's own is the one Salla ids `details-slider-{productId}`; falling
 * back to any slider that declares an `items` slot keeps this working if a
 * theme renames it.
 */
function gallerySlider(html: string): string {
  let fallback = ''
  const re = /<salla-slider\b([^>]*)>([\s\S]*?)<\/salla-slider>/gi
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const [, attrs, body] = m
    if (/id\s*=\s*["']details-slider/i.test(attrs)) return body
    if (!fallback && /slot\s*=\s*["'](items|thumbs)["']/i.test(body)) fallback = body
  }
  return fallback
}

/**
 * Every gallery image on a Salla product page, in the order the store shows
 * them. Returns [] for a page with no product slider.
 *
 * Two slots hold the same pictures. `thumbs` is preferred — its `src` is
 * always the real URL — while `items` (the big slider) lazy-loads everything
 * past the first slide behind a placeholder. We keep whichever slot yields
 * MORE images, so a theme that renders only the first few thumbnails still
 * produces the complete list.
 */
export function extractImageUrls(html: string): string[] {
  const slider = gallerySlider(html)
  if (!slider) return []

  const thumbsAt = slider.search(/slot\s*=\s*["']thumbs["']/i)
  const itemsAt = slider.search(/slot\s*=\s*["']items["']/i)
  const thumbsBlock = thumbsAt === -1 ? '' : slider.slice(thumbsAt)
  const itemsBlock =
    itemsAt === -1 ? '' : slider.slice(itemsAt, thumbsAt > itemsAt ? thumbsAt : undefined)

  const thumbs = dedupe(imgUrls(thumbsBlock))

  // Inside `items`, prefer the lightbox hrefs (always the full-size original,
  // never a placeholder) and fall back to the <img> tags.
  const hrefs = dedupe(lightboxUrls(itemsBlock))
  const imgs = dedupe(imgUrls(itemsBlock))
  const items = hrefs.length >= imgs.length ? hrefs : imgs

  return thumbs.length >= items.length ? thumbs : items
}

// --- Fetching ---------------------------------------------------------------

/**
 * Salla storefronts send no `Access-Control-Allow-Origin`, so a browser cannot
 * read a product page directly — every request goes through a CORS proxy.
 * They are tried in order and the first one returning a real product page
 * wins, which is also why a proxy that answers 200 with a cached error shell
 * costs us a retry instead of silently reporting "this product has no images".
 *
 * `direct` is last: it only succeeds outside the browser (tests, Node), where
 * there is no CORS to begin with.
 */
export interface Proxy {
  id: string
  url: (target: string) => string
  headers?: Record<string, string>
  /** Requests this proxy accepts per window, when it publishes a limit. */
  rate?: { limit: number; windowMs: number }
}

export const PROXIES: Proxy[] = [
  // Verified to serve the untouched HTML, and its preflight allows the header.
  // `x-ratelimit-limit: 20, 20;w=60` — 20 requests per minute, per IP.
  {
    id: 'jina',
    url: (u) => `https://r.jina.ai/${u}`,
    headers: { 'x-return-format': 'html' },
    rate: { limit: 20, windowMs: 60_000 },
  },
  { id: 'allorigins', url: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}` },
  { id: 'direct', url: (u) => u },
]

export interface FetchOptions {
  signal?: AbortSignal
}

/**
 * Retries left AFTER the pacer has already done its job. This is a safety net
 * for a limit we mis-modelled, not the primary mechanism — measuring showed
 * retry-alone is not enough: 100 pages through a 20/min proxy lost 21 of them
 * to 429, because a request can need to wait most of a 60s window and no
 * sensible retry budget covers that. The pacer below prevents the 429 instead.
 */
const RATE_LIMIT_RETRIES = 4

/** Used when the server names no delay — comfortably above the observed 2s. */
const DEFAULT_RETRY_MS = 3000

/** Exponential, so a proxy whose real limit is tighter still settles down. */
function backoffMs(attempt: number): number {
  return Math.min(DEFAULT_RETRY_MS * 2 ** attempt, 30_000)
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer)
      reject(new DOMException('aborted', 'AbortError'))
    }
    if (signal?.aborted) return abort()
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', abort, { once: true })
  })
}

/**
 * How long the server asked us to wait.
 *
 * Cross-origin responses only expose `Retry-After` when the server lists it in
 * `Access-Control-Expose-Headers`, which this one does not — so in the browser
 * this reads null and we fall back to the constant. That is deliberate: the
 * default is longer than the delay the server actually asks for.
 */
function retryAfterMs(res: Response): number {
  const seconds = Number(res.headers.get('retry-after'))
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : DEFAULT_RETRY_MS
}

/**
 * Sliding-window pacer shared by every worker hitting one proxy.
 *
 * The limit is per IP, so the whole app is one bucket no matter how many pages
 * are in flight. Admission is serialised through `queue`: without that, four
 * workers read the same "there is room" answer at the same instant and all
 * four go, which is precisely how the burst overshoots.
 */
class Pacer {
  private stamps: number[] = []
  private queue: Promise<void> = Promise.resolve()

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Resolves once this request is allowed to go out. */
  take(signal?: AbortSignal): Promise<void> {
    // Chain off the previous admission, and off its FAILURE too — one
    // cancelled run must not wedge the queue for everything after it.
    const admitted = this.queue.then(
      () => this.admit(signal),
      () => this.admit(signal),
    )
    this.queue = admitted.catch(() => {})
    return admitted
  }

  private async admit(signal?: AbortSignal): Promise<void> {
    for (;;) {
      const now = Date.now()
      while (this.stamps.length && now - this.stamps[0] >= this.windowMs) this.stamps.shift()
      if (this.stamps.length < this.limit) {
        this.stamps.push(now)
        return
      }
      // Full: sleep until the oldest request leaves the window.
      await sleep(this.windowMs - (now - this.stamps[0]) + 50, signal)
    }
  }
}

/** One pacer per rate-limited proxy, created once and shared process-wide. */
const pacers = new Map<string, Pacer>()

/**
 * Drop the recorded request history. Only for tests: they would otherwise
 * share one budget and start sleeping out a real 60-second window part-way
 * through the file.
 */
export function resetPacers(): void {
  pacers.clear()
}

function pacerFor(proxy: Proxy): Pacer | null {
  if (!proxy.rate) return null
  let pacer = pacers.get(proxy.id)
  if (!pacer) {
    pacer = new Pacer(proxy.rate.limit, proxy.rate.windowMs)
    pacers.set(proxy.id, pacer)
  }
  return pacer
}

/** Fetch one product page and return its gallery images. Throws if every proxy fails. */
export async function fetchProductImages(
  pageUrl: string,
  { signal }: FetchOptions = {},
): Promise<string[]> {
  let lastError = ''

  for (const proxy of PROXIES) {
    const pacer = pacerFor(proxy)
    for (let attempt = 0; attempt <= RATE_LIMIT_RETRIES; attempt++) {
      if (signal?.aborted) throw new DOMException('aborted', 'AbortError')
      try {
        await pacer?.take(signal)
        const res = await fetch(proxy.url(pageUrl), { headers: proxy.headers, signal })

        // Paced and still throttled: the real limit is tighter than we model,
        // so back off progressively rather than hammering the same proxy.
        if (res.status === 429 && attempt < RATE_LIMIT_RETRIES) {
          await sleep(Math.max(retryAfterMs(res), backoffMs(attempt)), signal)
          continue
        }
        if (!res.ok) {
          lastError = `${proxy.id}: HTTP ${res.status}`
          break
        }
        const html = await res.text()
        if (!hasGallery(html)) {
          lastError = `${proxy.id}: not a product page`
          break
        }
        return extractImageUrls(html)
      } catch (err) {
        if (signal?.aborted) throw err
        lastError = `${proxy.id}: ${err instanceof Error ? err.message : String(err)}`
        break
      }
    }
  }
  throw new Error(lastError || 'fetch failed')
}

export interface ScrapeTask {
  /** Index into `SourceSheet.rows` — how the result gets back to its product. */
  rowIndex: number
  url: string
}

export interface ScrapeResult extends ScrapeTask {
  images: string[]
  /** Set when every proxy failed; `images` is then empty. */
  error?: string
}

export interface ScrapeOptions extends FetchOptions {
  /** Pages in flight at once. Kept low — these are third-party proxies. */
  concurrency?: number
  onProgress?: (done: number, total: number) => void
}

/**
 * Fetch many product pages through a fixed-size worker pool. One page failing
 * never fails the batch: it comes back as a result carrying `error`, so the
 * caller can keep the images it did get and show what needs a retry.
 */
export async function scrapeImages(
  tasks: ScrapeTask[],
  { concurrency = 4, signal, onProgress }: ScrapeOptions = {},
): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = []
  let next = 0
  let done = 0

  async function worker() {
    for (;;) {
      if (signal?.aborted) return
      const i = next++
      if (i >= tasks.length) return
      const task = tasks[i]
      try {
        results.push({ ...task, images: await fetchProductImages(task.url, { signal }) })
      } catch (err) {
        if (signal?.aborted) return
        results.push({
          ...task,
          images: [],
          error: err instanceof Error ? err.message : String(err),
        })
      }
      onProgress?.(++done, tasks.length)
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(concurrency, tasks.length)) }, worker),
  )
  return results.sort((a, b) => a.rowIndex - b.rowIndex)
}

// --- Reading the sheet ------------------------------------------------------

/** Header words that name a product-page link, in either language. */
const URL_HEADER_RE = /(url|link|permalink|href|رابط|لينك|صفحة|المنتج\s*link)/i

/**
 * Guess which source column holds each product's page URL.
 *
 * Detection is by CONTENT, not by header name: a column qualifies when most of
 * its filled cells are links that are not images — which is exactly what a
 * product-page URL looks like to `classifyUrl`. The header name only breaks
 * ties, so an oddly-named column still gets found.
 */
export function detectProductUrlColumn(sheet: SourceSheet): string {
  let best = ''
  let bestCount = 0
  let bestNamed = false

  for (const header of sheet.headers) {
    let filled = 0
    let links = 0
    for (const row of sheet.rows) {
      const value = (row[header] ?? '').trim()
      if (!value) continue
      filled++
      if (classifyUrl(value) === 'link') links++
    }
    if (!filled || links / filled < 0.6) continue

    const named = URL_HEADER_RE.test(header)
    // A named column outranks an unnamed one; otherwise the fuller wins.
    if (named && !bestNamed) {
      best = header
      bestCount = links
      bestNamed = true
    } else if (named === bestNamed && links > bestCount) {
      best = header
      bestCount = links
    }
  }
  return best
}

/** The image URLs a row already carries under the current mapping. */
export function currentImages(row: SourceRow, config: MappingConfig): string[] {
  if (config.imageColumns.length) {
    return config.imageColumns.flatMap((col) => splitValues(row[col] ?? ''))
  }
  const source = config.fields[F.image]
  if (source?.kind === 'column') return splitValues(row[source.column] ?? '')
  if (source?.kind === 'constant') return splitValues(source.value)
  return []
}

/**
 * Rows the export would ship without a picture. A cell holding the product's
 * PAGE link counts as missing — that link is the very thing we scrape from,
 * not an image.
 */
export function rowsMissingImages(sheet: SourceSheet, config: MappingConfig): number[] {
  const out: number[] = []
  sheet.rows.forEach((row, index) => {
    if (Object.values(row).every((v) => !v)) return
    if (!currentImages(row, config).some(isImageUrl)) out.push(index)
  })
  return out
}

/** Build the fetch list: rows in `indices` that actually have a URL to visit. */
export function tasksFor(
  sheet: SourceSheet,
  urlColumn: string,
  indices: readonly number[],
): ScrapeTask[] {
  const tasks: ScrapeTask[] = []
  for (const rowIndex of indices) {
    const url = (sheet.rows[rowIndex]?.[urlColumn] ?? '').trim()
    if (/^https?:\/\//i.test(url)) tasks.push({ rowIndex, url })
  }
  return tasks
}
