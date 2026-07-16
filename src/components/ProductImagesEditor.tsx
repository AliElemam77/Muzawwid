import { useState } from 'react'
import { splitValues } from '../lib/build'
import { classifyUrl, type UrlKind } from '../lib/urls'
import { LINKS } from '../lib/links'
import { useI18n } from '../lib/i18n'
import { Button } from './ui'

/**
 * Where the user uploads their own image files and gets back hot-link URLs to
 * paste here — this tool never uploads anything itself (everything stays in the
 * browser), so an external host is the only way to turn a local file into a
 * link Salla can fetch.
 */
const UPLOADER_URL = LINKS.wepix

/** Per-link status chip: image / plain link / not a link at all. */
function KindBadge({ kind }: { kind: UrlKind }) {
  const { t } = useI18n()
  if (kind === 'image') return null
  const warn = kind === 'link'
  return (
    <span
      className={
        'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ' +
        (warn ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700')
      }
    >
      {warn ? t('img.badge.notImage') : t('img.badge.notUrl')}
    </span>
  )
}

/**
 * Edit one product's image list by hand: drop bad links, paste a batch of new
 * ones, or bounce out to the uploader to turn local files into links. The value
 * is the comma-joined «صورة المنتج» cell, which is also what the export writes.
 */
export default function ProductImagesEditor({
  value,
  onChange,
  onClose,
}: {
  value: string
  onChange: (next: string) => void
  onClose: () => void
}) {
  const { t } = useI18n()
  const [draft, setDraft] = useState('')
  const urls = splitValues(value)

  function addDraft() {
    const added = splitValues(draft)
    if (added.length === 0) return
    onChange([...new Set([...urls, ...added])].join(','))
    setDraft('')
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-slate-700">
          {t('img.title', { n: urls.length })}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={UPLOADER_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-indigo-300 bg-white px-2.5 py-1 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50"
          >
            {t('img.uploadCta')}
          </a>
          <Button variant="ghost" onClick={onClose}>
            {t('img.done')}
          </Button>
        </div>
      </div>

      <p className="mb-2 text-xs text-slate-500">{t('img.uploadHint')}</p>

      {urls.length > 0 && (
        <ul className="mb-3 space-y-1">
          {urls.map((url, i) => {
            const kind = classifyUrl(url)
            return (
              <li
                key={`${url}-${i}`}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1"
              >
                {kind === 'image' ? (
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    className="h-8 w-8 shrink-0 rounded-md border border-slate-200 object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-xs text-slate-400">
                    ?
                  </span>
                )}
                <span dir="ltr" className="min-w-0 flex-1 truncate text-xs text-slate-600" title={url}>
                  {url}
                </span>
                <KindBadge kind={kind} />
                <button
                  onClick={() => onChange(urls.filter((_, idx) => idx !== i).join(','))}
                  title={t('img.removeTitle')}
                  className="shrink-0 rounded-md border border-red-200 px-1.5 py-0.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                >
                  ✕
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        dir="ltr"
        rows={2}
        placeholder={t('img.addPlaceholder')}
        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500"
      />
      <div className="mt-2 flex items-center gap-2">
        <Button onClick={addDraft} disabled={!draft.trim()}>
          {t('img.addBtn')}
        </Button>
        {urls.length > 0 && (
          <Button variant="ghost" onClick={() => onChange('')}>
            {t('img.clear')}
          </Button>
        )}
      </div>
    </div>
  )
}
