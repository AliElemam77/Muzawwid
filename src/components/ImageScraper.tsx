import { useMemo, useRef, useState } from 'react'
import {
  detectProductUrlColumn,
  rowsMissingImages,
  scrapeImages,
  tasksFor,
  type ScrapeResult,
} from '../lib/scrape'
import type { SourceSheet } from '../lib/reader'
import type { MappingConfig } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { Button, Label, Select } from './ui'

type Phase =
  | { kind: 'idle' }
  | { kind: 'running'; done: number; total: number }
  | { kind: 'done'; results: ScrapeResult[]; cancelled: boolean }

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

  const detected = useMemo(() => detectProductUrlColumn(sheet), [sheet])
  const [urlColumn, setUrlColumn] = useState(detected)
  const [onlyMissing, setOnlyMissing] = useState(true)
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const abortRef = useRef<AbortController | null>(null)

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
  const percent = phase.kind === 'running' && phase.total > 0 ? Math.round((phase.done / phase.total) * 100) : 0

  return (
    <div className="mt-6 rounded-xl border border-[color:var(--ink)]/15 bg-[color:var(--cream)]/30 p-4 space-y-4">
      <div>
        <h3
          className="font-black text-[color:var(--ink)] text-base"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('scrape.title')}
        </h3>
        <p className="mt-1 text-xs font-medium text-[color:var(--ink)]/70">
          {t('scrape.subtitle')}
        </p>
      </div>

      {/* Prominent Heads-up Note that it takes time */}
      <div className="hard-2 flex items-start gap-2.5 rounded-xl bg-[color:var(--warning-tint)] p-3 text-xs text-[color:var(--ink)] border-[color:var(--mustard)]">
        <span className="text-base shrink-0">⏳</span>
        <p className="font-bold leading-relaxed">{t('scrape.timeWarning')}</p>
      </div>

      {!sheet.rows.length ? null : (
        <div className="space-y-3">
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

          {/* Running State with High Quality Loader Card */}
          {phase.kind === 'running' && (
            <div className="hard-2 rounded-xl bg-white p-4 space-y-3 shadow-sm border-[color:var(--violet)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block animate-spin text-lg">🔄</span>
                  <div>
                    <p className="text-xs font-black text-[color:var(--ink)]">
                      {t('scrape.progress', { done: phase.done, total: phase.total })}
                    </p>
                    <p className="text-[11px] font-medium text-[color:var(--ink)]/60">
                      {t('scrape.fetchingSubtitle')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[color:var(--violet)] px-2.5 py-0.5 text-xs font-black text-[color:var(--on-violet)]">
                    {percent}%
                  </span>
                  <Button variant="danger" onClick={cancel} className="!py-1 !px-2.5 text-xs">
                    {t('scrape.cancel')}
                  </Button>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div
                className="h-3 w-full overflow-hidden border border-[color:var(--ink)] bg-[color:var(--cream)] p-0.5"
                style={{ borderRadius: 'var(--r-pill)' }}
              >
                <div
                  className="h-full rounded-full bg-[color:var(--violet)] transition-all duration-300 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Idle Action Button */}
          {phase.kind !== 'running' && (
            <div className="flex items-center gap-3 pt-1">
              <Button
                onClick={run}
                disabled={!tasks.length}
                className="!py-2 !px-4 text-xs font-black"
              >
                🚀 {t('scrape.run', { n: tasks.length })}
              </Button>
              {urlColumn && !tasks.length && (
                <span className="text-xs font-bold text-[color:var(--ink)]/60">
                  {t('scrape.nothingToDo')}
                </span>
              )}
            </div>
          )}

          {/* Results Summary Box */}
          {summary && (
            <div className="hard-2 rounded-xl bg-white p-3.5 space-y-2">
              <p className="text-xs font-black text-[color:var(--ink)]">
                {t('scrape.result', { products: summary.filled, images: summary.images })}
              </p>
              {phase.kind === 'done' && phase.cancelled && (
                <p className="text-xs font-bold text-[color:var(--mustard)]">{t('scrape.cancelled')}</p>
              )}
              {summary.empty > 0 && (
                <p className="text-xs font-medium text-[color:var(--ink)]/65">
                  {t('scrape.empty', { n: summary.empty })}
                </p>
              )}
              {summary.failed.length > 0 && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs font-bold text-[color:var(--coral)]">
                    {t('scrape.failed', { n: summary.failed.length })}
                  </summary>
                  <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto scroll-thin">
                    {summary.failed.slice(0, 15).map((r) => (
                      <li key={r.rowIndex} dir="ltr" className="truncate text-[11px] text-[color:var(--ink)]/70">
                        {r.url} — {r.error}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-[10px] font-bold text-[color:var(--ink)]/60">{t('scrape.retryHint')}</p>
                </details>
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
