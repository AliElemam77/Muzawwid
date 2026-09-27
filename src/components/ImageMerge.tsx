import { Check } from 'lucide-react'
import { useI18n } from '../lib/i18n'

/** Multi-select of source columns to merge (dedup, comma-joined) into صورة المنتج. */
export default function ImageMerge({
  columns,
  selected,
  onChange,
}: {
  columns: string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const { t } = useI18n()
  function toggle(col: string) {
    onChange(
      selected.includes(col)
        ? selected.filter((c) => c !== col)
        : [...selected, col],
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#D4D4D4]">{t('images.note')}</p>
        {selected.length > 0 && (
          <span className="rounded-full bg-[#12b3a4]/20 border border-[#12b3a4]/40 px-2.5 py-0.5 text-xs font-black text-[#2FE0CF]">
            {t('images.selectedCount', { n: selected.length })}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {columns.map((col) => {
          const on = selected.includes(col)
          return (
            <button
              key={col}
              type="button"
              onClick={() => toggle(col)}
              className={`flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                on
                  ? 'bg-[#12b3a4]/20 border border-[#12b3a4]/50 text-[#2FE0CF]'
                  : 'bg-[#181818] border border-white/10 text-[#D4D4D4] hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className={`flex h-4 w-4 items-center justify-center rounded-sm border ${on ? 'bg-[#12b3a4] border-[#12b3a4] text-[#050505]' : 'border-white/20 bg-transparent'}`}>
                {on && <Check className="size-3 stroke-[3]" />}
              </span>
              <span>{col}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
