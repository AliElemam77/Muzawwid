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
  function toggle(col: string) {
    onChange(
      selected.includes(col)
        ? selected.filter((c) => c !== col)
        : [...selected, col],
    )
  }

  return (
    <div>
      <p className="mb-2 text-sm text-slate-500">
        اختر أعمدة الصور — تُدمج الروابط غير الفارغة (بدون تكرار) في عمود «صورة المنتج».
      </p>
      <div className="flex flex-wrap gap-2">
        {columns.map((col) => {
          const on = selected.includes(col)
          return (
            <label
              key={col}
              className={
                'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition ' +
                (on
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50')
              }
            >
              <input
                type="checkbox"
                className="accent-indigo-600"
                checked={on}
                onChange={() => toggle(col)}
              />
              {col}
            </label>
          )
        })}
      </div>
    </div>
  )
}
