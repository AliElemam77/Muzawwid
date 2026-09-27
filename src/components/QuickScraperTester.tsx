import { useState } from 'react'
import {
  FlaskConical,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Check,
} from 'lucide-react'
import { fetchProductImages } from '../lib/scrape'
import { useI18n } from '../lib/i18n'
import { Button, TextInput } from './ui'

export default function QuickScraperTester() {
  const { t } = useI18n()
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
        setError(t('tester.noImages'))
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
    <div className="card mb-8 border border-[color:var(--violet)]/40 bg-[#111111] p-5 shadow-lg">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--violet)] text-[color:var(--on-violet)]">
            <FlaskConical className="size-5" />
          </span>
          <div>
            <h3
              className="text-base font-black text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('tester.title')}
            </h3>
            <p className="text-xs font-medium text-[#A3A3A3]">{t('tester.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <TextInput
            type="url"
            dir="ltr"
            placeholder={t('tester.urlPlaceholder')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="!text-xs font-mono !py-2.5 placeholder:font-sans placeholder:text-[#777777]"
          />
        </div>
        <Button
          onClick={handleTest}
          disabled={loading || !url.trim()}
          variant="coral"
          className="shrink-0 !py-2.5 !px-5 text-xs font-black"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>{t('tester.running')}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-4" />
              <span>{t('tester.fetch')}</span>
            </span>
          )}
        </Button>
      </div>

      {/* Loading notice */}
      {loading && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-[#1A1A1A] p-3 text-xs font-bold text-[color:var(--ink)]">
          <Loader2 className="size-4 animate-spin text-[color:var(--coral-accent)]" />
          <span>{t('tester.runningNote')}</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="mt-4 rounded-lg border border-[#FF6B50]/35 bg-[#FF6B50]/12 p-3 text-xs text-[#FF856E]">
          <div className="mb-1 flex items-center gap-1.5 font-black">
            <AlertTriangle className="size-4" />
            <span>{t('tester.errorTitle')}</span>
          </div>
          <p dir="ltr" className="text-start font-mono text-[11px] text-[#EBEBEB]">
            {error}
          </p>
          <p className="mt-1.5 text-[11px] text-[#D4D4D4]">{t('tester.errorHint')}</p>
        </div>
      )}

      {/* Results state */}
      {images && !loading && (
        <div className="mt-4 rounded-xl border border-white/10 bg-[#161616] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="pill pill--teal flex items-center gap-1 text-xs font-black">
                <CheckCircle2 className="size-3.5" />
                <span>{t('tester.found', { n: images.length })}</span>
              </span>
            </div>

            {images.length > 0 && (
              <Button
                variant="secondary"
                onClick={copyAll}
                className="flex items-center gap-1.5 !py-1 !px-3 text-xs font-bold"
              >
                {copiedAll ? (
                  <>
                    <Check className="size-3.5" />
                    <span>{t('tester.copiedAll')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>{t('tester.copyAll')}</span>
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {images.map((imgUrl, index) => (
              <div
                key={`${imgUrl}-${index}`}
                className="group relative flex flex-col rounded-lg border border-white/10 bg-[#111111] p-1.5 transition hover:border-white/25"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-md bg-[#0A0A0A]">
                  <img
                    src={imgUrl}
                    alt={t('tester.imageAlt', { n: index + 1 })}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.style.display = 'none'
                      target.parentElement?.classList.add(
                        'flex',
                        'items-center',
                        'justify-center',
                        'text-xs',
                        'text-[#A3A3A3]',
                      )
                      if (target.parentElement)
                        target.parentElement.innerText = t('tester.imageUnavailable')
                    }}
                  />
                  <span className="absolute top-1 start-1 rounded bg-black/70 px-1 py-0.5 text-[10px] font-bold text-white">
                    #{index + 1}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-1">
                  <a
                    href={imgUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-0.5 truncate font-mono text-[10px] text-[#c4b5fd] hover:underline"
                    title={imgUrl}
                  >
                    <span>{t('tester.view')}</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => copyOne(imgUrl, index)}
                    className="flex shrink-0 items-center gap-1 rounded border border-white/10 bg-[#1A1A1A] px-1.5 py-0.5 text-[10px] font-bold text-[#D4D4D4] transition hover:bg-[#262626] hover:text-white"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="size-3" />
                        <span>{t('tester.copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>{t('tester.copy')}</span>
                      </>
                    )}
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
