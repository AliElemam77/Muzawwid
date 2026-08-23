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
        <p className="text-xs font-medium text-(--ink)/70">{t('images.note')}</p>
        {selected.length > 0 && (
          <span className="rounded-full bg-(--teal)/20 border border-(--teal) px-2 py-0.5 text-xs font-black text-(--ink)">
            تم تحديد {selected.length} أعمدة
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
              className={`hard-2 lift flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                on
                  ? 'bg-(--teal) text-(--on-teal)'
                  : 'bg-white text-(--ink) hover:bg-(--cream)'
              }`}
            >
              <span className={`flex h-4 w-4 items-center justify-center rounded-sm border border-(--ink) ${on ? 'bg-white text-(--ink) font-black text-[10px]' : 'bg-transparent'}`}>
                {on ? '✓' : ''}
              </span>
              <span>{col}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
