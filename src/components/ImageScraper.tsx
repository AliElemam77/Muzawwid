import { useMemo, useRef, useState } from 'react'
import {
  detectProductUrlColumn,
  rowsMissingImages,
  scrapeImages,
  tasksFor,
  type ScrapeResult,
} from '../lib/scrape'
import {
  Camera,
  Check,
  X,
  Clock,
  FlaskConical,
  Loader2,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import type { SourceSheet } from '../lib/reader'
import type { MappingConfig } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { Button, Label, Select } from './ui'
import QuickScraperTester from './QuickScraperTester'

type Phase =
  | { kind: 'idle' }
  | { kind: 'running'; done: number; total: number }
  | { kind: 'done'; results: ScrapeResult[]; cancelled: boolean }

const STORAGE_KEY = 'muzawwid:scraper-enabled'

export default function ImageScraper({
  sheet,
  config,
  alreadyFilled,
  onFilled,
}: {
  sheet: SourceSheet
  config: MappingConfig
  /** Rows a previous run (or a hand edit) already gave images to. */
  alreadyFilled: ReadonlySet<number>
  /** Comma-joined image URLs, keyed by source row index. */
  onFilled: (images: Record<number, string>) => void
}) {
  const { t } = useI18n()

  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const [showQuickTester, setShowQuickTester] = useState(false)
  const detected = useMemo(() => detectProductUrlColumn(sheet), [sheet])
  const [urlColumn, setUrlColumn] = useState(detected)
  const [onlyMissing, setOnlyMissing] = useState(true)
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const abortRef = useRef<AbortController | null>(null)

  function handleToggle(val: boolean) {
    setEnabled(val)
    try {
      localStorage.setItem(STORAGE_KEY, String(val))
    } catch {
      /* ignore */
    }
  }

  const missing = useMemo(
    () => rowsMissingImages(sheet, config).filter((i) => !alreadyFilled.has(i)),
    [sheet, config, alreadyFilled],
  )
  const allRows = useMemo(
    () => sheet.rows.map((_, i) => i).filter((i) => Object.values(sheet.rows[i]).some(Boolean)),
    [sheet],
  )
  const targets = onlyMissing ? missing : allRows
  const tasks = useMemo(
    () => (urlColumn ? tasksFor(sheet, urlColumn, targets) : []),
    [sheet, urlColumn, targets],
  )

  async function run() {
    if (!tasks.length) return
    const controller = new AbortController()
    abortRef.current = controller
    setPhase({ kind: 'running', done: 0, total: tasks.length })

    const results = await scrapeImages(tasks, {
      signal: controller.signal,
      onProgress: (done, total) => setPhase({ kind: 'running', done, total }),
    })

    // Write straight through, so a cancelled run still keeps what it fetched.
    const filled: Record<number, string> = {}
    for (const r of results) {
      if (r.images.length) filled[r.rowIndex] = r.images.join(',')
    }
    if (Object.keys(filled).length) onFilled(filled)

    abortRef.current = null
    setPhase({ kind: 'done', results, cancelled: controller.signal.aborted })
  }

  function cancel() {
    abortRef.current?.abort()
  }

  const summary = phase.kind === 'done' ? summarize(phase.results) : null
  const percent =
    phase.kind === 'running' && phase.total > 0 ? Math.round((phase.done / phase.total) * 100) : 0

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-[#141414] p-5 shadow-lg transition-all">
      {/* Header & Feature Activation Toggle Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF6B50]/15 border border-[#FF6B50]/30 text-[#FF6B50] shadow-xs">
            <Camera className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className="font-black text-white text-base"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t('scrape.title')}
              </h3>
              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black border transition ${
                  enabled
                    ? 'bg-[#12b3a4]/20 border-[#12b3a4]/40 text-[#2FE0CF]'
                    : 'bg-white/5 border border-white/10 text-[#A3A3A3]'
                }`}
              >
                {enabled && <Check className="size-3" />}
                <span>{enabled ? t('scrape.enabled') : t('scrape.disabled')}</span>
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-[#D4D4D4]">
              {t('scrape.subtitle')}
            </p>
          </div>
        </div>

        {/* Neo-Brutalist Accessible Toggle Switch */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <span className="text-xs font-bold text-[#D4D4D4]">
            {enabled ? t('scrape.enabled') : t('scrape.disabled')}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => handleToggle(!enabled)}
            title={t('scrape.switchLabel')}
            aria-label={t('scrape.switchLabel')}
            dir="ltr"
            className={`group relative inline-flex h-8 w-15 shrink-0 cursor-pointer rounded-full border border-white/20 p-0.5 transition-colors duration-200 ease-in-out ${
              enabled ? 'bg-[#12b3a4]' : 'bg-[#222222]'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white text-[11px] font-black shadow-md transition duration-200 ease-in-out ${
                enabled
                  ? 'translate-x-7 text-[#12b3a4]'
                  : 'translate-x-0 text-[#666666]'
              }`}
            >
              {enabled ? <Check className="size-3.5 stroke-[3]" /> : <X className="size-3.5 stroke-[3]" />}
            </span>
          </button>
        </div>
      </div>

      {/* Expanded Controls When Feature is Enabled */}
      {enabled && (
        <div className="mt-5 space-y-4 border-t-2 border-dashed border-[color:var(--ink)]/15 pt-5">
          {/* Heads-up Note */}
          <div className="hard-2 flex items-start gap-2.5 rounded-xl bg-[color:var(--warning-tint)] p-3 text-xs text-[color:var(--ink)] border-[color:var(--mustard)]">
            <Clock className="size-4 shrink-0 text-[color:var(--ink)] mt-0.5" />
            <p className="font-bold leading-relaxed">{t('scrape.timeWarning')}</p>
          </div>

          {/* Quick Tester Collapsible Drawer */}
          <div className="rounded-xl border border-[color:var(--ink)]/20 bg-[color:var(--cream)]/40 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--violet)] text-white">
                  <FlaskConical className="size-3.5" />
                </span>
                <div>
                  <h4 className="text-xs font-black text-[color:var(--ink)]">
                    {t('scrape.quickTest')}
                  </h4>
                  <p className="text-[11px] text-[color:var(--ink)]/65 font-medium">
                    {t('scrape.quickTestDesc')}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowQuickTester((v) => !v)}
                className="!py-1 !px-2.5 text-xs font-bold shrink-0 flex items-center gap-1"
              >
                {showQuickTester ? (
                  <>
                    <ChevronUp className="size-3" />
                    <span>{t('scrape.hideTester')}</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3" />
                    <span>{t('scrape.showTester')}</span>
                  </>
                )}
              </Button>
            </div>

            {showQuickTester && (
              <div className="mt-3 pt-3 border-t border-[color:var(--ink)]/10">
                <QuickScraperTester />
              </div>
            )}
          </div>

          {!sheet.rows.length ? null : (
            <div className="space-y-4">
              <div className="max-w-md space-y-1">
                <Label>{t('scrape.urlColumn')}</Label>
                <Select
                  value={urlColumn}
                  onChange={(e) => setUrlColumn(e.target.value)}
                  disabled={phase.kind === 'running'}
                  className="!py-1.5 !text-xs font-bold"
                >
                  <option value="">{t('scrape.pickColumn')}</option>
                  {sheet.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                      {h === detected ? ` — ${t('scrape.detected')}` : ''}
                    </option>
                  ))}
                </Select>
                {!urlColumn && (
                  <p className="text-[11px] text-[color:var(--ink)]/60 font-medium">
                    {detected ? t('scrape.pickHint') : t('scrape.noColumn')}
                  </p>
                )}
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-[color:var(--ink)]">
                <input
                  type="checkbox"
                  className="accent-[color:var(--violet)]"
                  checked={onlyMissing}
                  onChange={(e) => setOnlyMissing(e.target.checked)}
                  disabled={phase.kind === 'running'}
                />
                <span>{t('scrape.onlyMissing', { n: missing.length })}</span>
              </label>

              {/* Running State with High Quality Animated Card */}
              {phase.kind === 'running' && (
                <div className="rounded-xl bg-[#181818] p-4 space-y-3 shadow-sm border border-[#FF6B50]/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-5 animate-spin text-[#FF6B50]" />
                      <div>
                        <p className="text-xs font-black text-white">
                          {t('scrape.progress', { done: phase.done, total: phase.total })}
                        </p>
                        <p className="text-[11px] font-medium text-[#A3A3A3]">
                          {t('scrape.fetchingSubtitle')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#FF6B50] px-2.5 py-0.5 text-xs font-black text-[#050505]">
                        {percent}%
                      </span>
                      <Button variant="danger" onClick={cancel} className="!py-1 !px-2.5 text-xs">
                        {t('scrape.cancel')}
                      </Button>
                    </div>
                  </div>

                  {/* Animated Progress Bar */}
                  <div
                    className="h-2.5 w-full overflow-hidden rounded-full bg-[#222222] p-0.5 border border-white/10"
                  >
                    <div
                      className="h-full rounded-full bg-[#FF6B50] transition-all duration-300 ease-out"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Idle Action Button */}
              {phase.kind !== 'running' && (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={run}
                    disabled={!tasks.length}
                    className="flex items-center gap-2 rounded-xl bg-[#FF6B50] px-5 py-2 text-xs font-black text-[#050505] shadow-lg shadow-[#FF6B50]/20 transition-all hover:bg-[#ff856e] hover:scale-105 active:scale-95 disabled:opacity-40"
                  >
                    <Sparkles className="size-3.5" />
                    <span>{t('scrape.run', { n: tasks.length })}</span>
                  </button>
                  {urlColumn && !tasks.length && (
                    <span className="text-xs font-bold text-[#A3A3A3]">
                      {t('scrape.nothingToDo')}
                    </span>
                  )}
                </div>
              )}

              {/* Results Summary Box */}
              {summary && (
                <div className="rounded-xl bg-[#181818] border border-white/10 p-3.5 space-y-2">
                  <p className="text-xs font-black text-white">
                    {t('scrape.result', { products: summary.filled, images: summary.images })}
                  </p>
                  {phase.kind === 'done' && phase.cancelled && (
                    <p className="text-xs font-bold text-[#ffc531]">
                      {t('scrape.cancelled')}
                    </p>
                  )}
                  {summary.empty > 0 && (
                    <p className="text-xs font-medium text-[#D4D4D4]">
                      {t('scrape.empty', { n: summary.empty })}
                    </p>
                  )}
                  {summary.failed.length > 0 && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs font-bold text-[#FF6B50]">
                        {t('scrape.failed', { n: summary.failed.length })}
                      </summary>
                      <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto scroll-thin">
                        {summary.failed.slice(0, 15).map((r) => (
                          <li
                            key={r.rowIndex}
                            dir="ltr"
                            className="truncate text-[11px] text-[#D4D4D4]"
                          >
                            {r.url} — {r.error}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1 text-[10px] font-bold text-[#A3A3A3]">
                        {t('scrape.retryHint')}
                      </p>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function summarize(results: ScrapeResult[]) {
  const failed = results.filter((r) => r.error)
  const withImages = results.filter((r) => r.images.length)
  return {
    filled: withImages.length,
    images: withImages.reduce((n, r) => n + r.images.length, 0),
    empty: results.length - withImages.length - failed.length,
    failed,
  }
}
