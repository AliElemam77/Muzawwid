import { useState } from 'react'
import { fetchProductImages } from '../lib/scrape'
import { Button, TextInput } from './ui'

export default function QuickScraperTester() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  async function handleTest() {
    let target = url.trim()
    if (!target) return
    if (!/^https?:\/\//i.test(target)) {
      target = `https://${target}`
      setUrl(target)
    }

    setLoading(true)
    setError(null)
    setImages(null)
    setCopiedAll(false)

    try {
      const results = await fetchProductImages(target)
      setImages(results)
      if (results.length === 0) {
        setError('لم نتمكن من العثور على صور لهذا المنتج في الصفحة.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !loading) {
      handleTest()
    }
  }

  function copyAll() {
    if (!images || !images.length) return
    navigator.clipboard.writeText(images.join(','))
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  function copyOne(imgUrl: string, idx: number) {
    navigator.clipboard.writeText(imgUrl)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 1500)
  }

  return (
    <div className="card mb-8 p-5 border-2 border-[color:var(--violet)] bg-white shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--violet)] text-xl text-[color:var(--on-violet)]">
            🧪
          </span>
          <div>
            <h3
              className="text-base font-extrabold text-[color:var(--ink)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              تجربة جلب الصور من أي رابط (Live Scraper Tester)
            </h3>
            <p className="text-xs text-[color:var(--ink)]/70 font-medium">
              ضع رابط صفحة أي منتج (سلة، زد، شوبيفاي، ووكومرس، أو موقع React) لاستخراج كل صوره فوراً بدون شيت.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
        <div className="relative flex-1">
          <TextInput
            type="url"
            dir="ltr"
            placeholder="https://example.com/product/123..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="!text-xs font-mono !py-2.5 placeholder:text-slate-400 placeholder:font-sans"
          />
        </div>
        <Button
          onClick={handleTest}
          disabled={loading || !url.trim()}
          className="shrink-0 !py-2.5 !px-5 text-xs font-black"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block animate-spin">🔄</span>
              <span>جارٍ الفحص…</span>
            </span>
          ) : (
            'جلب الصور 🚀'
          )}
        </Button>
      </div>

      {/* Loading notice */}
      {loading && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-[color:var(--cream)] p-3 text-xs font-bold text-[color:var(--ink)]">
          <span className="animate-spin text-base">⏳</span>
          <span>جارٍ فحص الرابط عبر Jina AI واستخراج بيانات المعرض والـ JSON-LD… يرجى الانتظار ثوانٍ.</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800">
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <span>⚠️</span>
            <span>تعذّر استخراج الصور:</span>
          </div>
          <p className="font-mono text-[11px] opacity-90 dir-ltr text-start">{error}</p>
          <p className="mt-1.5 text-[11px] text-red-700">
            تأكد أن الرابط يعمل في المتصفح ويشير مباشرة إلى صفحة منتج عامة.
          </p>
        </div>
      )}

      {/* Results state */}
      {images && !loading && (
        <div className="mt-4 rounded-xl border border-[color:var(--ink)]/15 bg-[color:var(--cream)]/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="pill pill--teal font-black text-xs">
                ✅ تم العثور على {images.length} صورة
              </span>
            </div>

            {images.length > 0 && (
              <Button
                variant="secondary"
                onClick={copyAll}
                className="!py-1 !px-3 text-xs font-bold"
              >
                {copiedAll ? '✓ تم نسخ جميع الروابط!' : '📋 نسخ كل الروابط (مفصولة بفاصلة)'}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {images.map((imgUrl, index) => (
              <div
                key={`${imgUrl}-${index}`}
                className="group relative flex flex-col rounded-lg border border-[color:var(--ink)]/20 bg-white p-1.5 shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-md bg-slate-100">
                  <img
                    src={imgUrl}
                    alt={`صورة ${index + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.style.display = 'none'
                      target.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'text-xs', 'text-slate-400')
                      if (target.parentElement) target.parentElement.innerText = 'صورة غير متاحة'
                    }}
                  />
                  <span className="absolute top-1 start-1 rounded bg-black/60 px-1 py-0.5 text-[10px] font-bold text-white">
                    #{index + 1}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-1">
                  <a
                    href={imgUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-[10px] text-[color:var(--violet)] hover:underline font-mono"
                    title={imgUrl}
                  >
                    عرض ↗
                  </a>
                  <button
                    type="button"
                    onClick={() => copyOne(imgUrl, index)}
                    className="shrink-0 rounded bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 transition"
                  >
                    {copiedIndex === index ? '✓ نُسخ' : 'نسخ'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
