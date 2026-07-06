import type { SourceWorkbook, SourceSheet } from '../lib/reader'

const PREVIEW_ROWS = 10

/** Sheet picker (if multiple) + a preview table of the first ~10 source rows. */
export default function SourcePreview({
  workbook,
  sheet,
  onPickSheet,
}: {
  workbook: SourceWorkbook
  sheet: SourceSheet
  onPickSheet: (name: string) => void
}) {
  const rows = sheet.rows.slice(0, PREVIEW_ROWS)

  return (
    <div>
      {workbook.sheets.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-600">اختر الورقة:</span>
          {workbook.sheets.map((s) => (
            <button
              key={s.name}
              onClick={() => onPickSheet(s.name)}
              className={
                'rounded-lg px-3 py-1.5 text-sm font-semibold transition ' +
                (s.name === sheet.name
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
              }
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <p className="mb-2 text-sm text-slate-500">
        {sheet.headers.length} عمود · {sheet.rows.length} صف — يظهر أول {rows.length} صف
      </p>

      <div className="scroll-thin overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50">
            <tr>
              {sheet.headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-right font-semibold text-slate-700"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="odd:bg-white even:bg-slate-50/50">
                {sheet.headers.map((h) => (
                  <td
                    key={h}
                    className="max-w-[16rem] truncate whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-600"
                    title={r[h]}
                  >
                    {r[h]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
