import { FileSpreadsheet } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { relativeTime } from '../lib/time'
import type { HistoryItem } from '../lib/types'

/**
 * Saved sheets, on the opening screen.
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

  const reusable = saved.filter((item) => item.sheet)
  if (reusable.length === 0) return null

  return (
    <section>
      <h3
        className="mb-1 font-black text-white text-xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {t('saved.title')}
      </h3>
      <p className="mb-4 text-xs text-[#D4D4D4]">
        {t('saved.subtitle')}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {reusable.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPick(item)}
            className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-[#141414] p-4 text-start transition-all hover:border-[#FF6B50]/50 hover:bg-[#1A1A1A]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF6B50]/15 border border-[#FF6B50]/30 text-[#FF6B50]">
              <FileSpreadsheet className="size-5" />
            </div>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span
                  className="truncate font-black text-white text-sm"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {item.name}
                </span>
                <span className="rounded-full bg-[#12b3a4]/20 border border-[#12b3a4]/40 px-2 py-0.5 text-[11px] font-black text-[#2FE0CF]">
                  {t('saved.count', { n: item.sheet?.rows.length ?? 0 })}
                </span>
              </span>
              <span
                className="mt-1 block truncate text-xs text-[#A3A3A3]"
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
