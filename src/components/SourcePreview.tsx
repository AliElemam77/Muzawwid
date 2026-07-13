import type { SourceWorkbook, SourceSheet } from '../lib/reader'
import { isImageUrl } from '../lib/product'
import { useI18n } from '../lib/i18n'

const PREVIEW_ROWS = 10

/** Any http(s) URL token (stops at whitespace / comma / pipe). */
const URL_RE = /https?:\/\/[^\s,،|]+/gi

/**
 * Preview-only cleanup: replace non-image links with a small placeholder so the
 * source table stays readable. Image URLs are kept (the user maps them), and
 * text without links is returned untouched. Does NOT alter the actual data.
 */
function displayCell(value: string, placeholder: string): string {
  if (!value || !/https?:\/\//i.test(value)) return value
  return value.replace(URL_RE, (u) => (isImageUrl(u) ? u : placeholder))
}

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
  const { t } = useI18n()
  const rows = sheet.rows.slice(0, PREVIEW_ROWS)
  const linkPlaceholder = t('source.hiddenLink')

  return (
    <div>
      {workbook.sheets.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-600">{t('source.pick')}</span>
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
        {t('source.stats', {
          cols: sheet.headers.length,
          rows: sheet.rows.length,
          shown: rows.length,
        })}
      </p>

      <div className="scroll-thin overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50">
            <tr>
              {sheet.headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-start font-semibold text-slate-700"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="odd:bg-white even:bg-slate-50/50">
                {sheet.headers.map((h) => {
                  const shown = displayCell(r[h] ?? '', linkPlaceholder)
                  return (
                    <td
                      key={h}
                      className="max-w-[16rem] truncate whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-600"
                      title={shown}
                    >
                      {shown}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
