import { useState } from 'react'
import { splitValues } from '../lib/build'
import { classifyUrl, type UrlKind } from '../lib/urls'
import { useI18n } from '../lib/i18n'
import { Button } from './ui'
import WepixUploadModal from './WepixUploadModal'

/** Per-link status chip: image / plain link / not a link at all. */
function KindBadge({ kind }: { kind: UrlKind }) {
  const { t } = useI18n()
  if (kind === 'image') return null
  const warn = kind === 'link'
  return (
    <span
      className={
        'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ' +
        (warn
          ? 'border border-[#ffc531]/35 bg-[#ffc531]/15 text-[#ffd666]'
          : 'border border-[#FF6B50]/35 bg-[#FF6B50]/15 text-[#FF856E]')
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
  // The uploader opens in place, so the mapping being edited stays put.
  const [uploaderOpen, setUploaderOpen] = useState(false)
  const urls = splitValues(value)

  function addDraft() {
    const added = splitValues(draft)
    if (added.length === 0) return
    onChange([...new Set([...urls, ...added])].join(','))
    setDraft('')
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#161616] p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-white">
          {t('img.title', { n: urls.length })}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUploaderOpen(true)}
            className="rounded-lg border border-[color:var(--violet)]/40 bg-[color:var(--violet)]/15 px-2.5 py-1 text-xs font-bold text-[#c4b5fd] transition hover:bg-[color:var(--violet)]/25 hover:text-white"
          >
            {t('img.uploadCta')}
          </button>
          <Button variant="ghost" onClick={onClose}>
            {t('img.done')}
          </Button>
        </div>
      </div>

      <p className="mb-2 text-xs text-[#A3A3A3]">{t('img.uploadHint')}</p>

      {urls.length > 0 && (
        <ul className="mb-3 space-y-1">
          {urls.map((url, i) => {
            const kind = classifyUrl(url)
            return (
              <li
                key={`${url}-${i}`}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#111111] px-2 py-1"
              >
                {kind === 'image' ? (
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    className="h-8 w-8 shrink-0 rounded-md border border-white/10 object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 text-xs text-[#A3A3A3]">
                    ?
                  </span>
                )}
                <span dir="ltr" className="min-w-0 flex-1 truncate text-xs text-[#D4D4D4]" title={url}>
                  {url}
                </span>
                <KindBadge kind={kind} />
                <button
                  onClick={() => onChange(urls.filter((_, idx) => idx !== i).join(','))}
                  title={t('img.removeTitle')}
                  className="shrink-0 rounded-md border border-[#FF6B50]/35 px-1.5 py-0.5 text-xs font-bold text-[#FF856E] transition hover:bg-[#FF6B50]/15 hover:text-white"
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
        className="w-full rounded-lg border border-white/10 bg-[#1A1A1A] px-2 py-1.5 text-xs text-[color:var(--ink)] outline-none transition focus:border-[color:var(--coral-accent)] placeholder:text-[#777777]"
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

      {uploaderOpen && <WepixUploadModal onClose={() => setUploaderOpen(false)} />}
    </div>
  )
}
