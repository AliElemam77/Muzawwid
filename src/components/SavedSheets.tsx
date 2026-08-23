import { useI18n } from '../lib/i18n'
import { relativeTime } from '../lib/time'
import type { HistoryItem } from '../lib/types'

/**
 * Saved sheets, on the opening screen.
 *
 * A sheet you finished once is the best starting point for the next one — same
 * columns, same mapping, same defaults. Saving on export already kept both the
 * sheet and its mapping; this surfaces them where you start, so reusing one is
 * a click instead of something to go looking for in the drawer.
 */
export default function SavedSheets({
  saved,
  onPick,
}: {
  saved: HistoryItem[]
  onPick: (item: HistoryItem) => void
}) {
  const { t, lang } = useI18n()
  const locale = lang === 'ar' ? 'ar-EG' : 'en-GB'

  // Only entries carrying a sheet snapshot can be reopened — the rest are a
  // saved mapping with nothing to apply it to.
  const reusable = saved.filter((item) => item.sheet)
  if (reusable.length === 0) return null

  return (
    <section>
      <h3
        className="mb-1 font-extrabold text-(--ink)"
        style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-section)' }}
      >
        {t('saved.title')}
      </h3>
      <p className="mb-4 text-(--ink)/65" style={{ fontSize: 'var(--fs-label)' }}>
        {t('saved.subtitle')}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {reusable.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPick(item)}
            className="card lift flex items-start gap-3 p-4 text-start transition"
            style={{ borderColor: 'var(--ink)' }}
          >
            <span aria-hidden className="text-2xl leading-none">
              📄
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-1.5">
                <span
                  className="truncate font-extrabold text-(--ink)"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-body)' }}
                >
                  {item.name}
                </span>
                <span className="pill pill--teal">
                  {t('saved.count', { n: item.sheet?.rows.length ?? 0 })}
                </span>
              </span>
              <span
                className="mt-1 block truncate text-(--ink)/60"
                style={{ fontSize: 'var(--fs-label)' }}
              >
                {relativeTime(item.ts, locale)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
