import type { SourceWorkbook, SourceSheet } from '../lib/reader'
import { isImageUrl } from '../lib/urls'
import { useI18n } from '../lib/i18n'
import StepTips from './StepTips'

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
      <div className="mb-4">
        <StepTips tips={[t('tips.source.1'), t('tips.source.2'), t('tips.source.3')]} />
      </div>
      {workbook.sheets.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#D4D4D4]">{t('source.pick')}</span>
          {workbook.sheets.map((s) => (
            <button
              key={s.name}
              onClick={() => onPickSheet(s.name)}
              className={
                'rounded-lg px-3 py-1.5 text-xs font-bold transition ' +
                (s.name === sheet.name
                  ? 'bg-[#FF6B50] text-[#050505]'
                  : 'bg-[#181818] border border-white/10 text-[#D4D4D4] hover:text-white hover:bg-white/5')
              }
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <p className="mb-2.5 text-xs font-bold text-[#A3A3A3]">
        {t('source.stats', {
          cols: sheet.headers.length,
          rows: sheet.rows.length,
          shown: rows.length,
        })}
      </p>

      <div className="scroll-thin overflow-x-auto rounded-xl border border-white/10 bg-[#111111]">
        <table className="min-w-full border-collapse text-xs">
          <thead className="bg-[#161616] border-b border-white/10">
            <tr>
              {sheet.headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-3.5 py-2.5 text-start font-black text-[#FFFFFF]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-white/5 odd:bg-[#111111] even:bg-[#151515] hover:bg-white/5 transition-colors">
                {sheet.headers.map((h) => {
                  const shown = displayCell(r[h] ?? '', linkPlaceholder)
                  return (
                    <td
                      key={h}
                      className="max-w-[16rem] truncate whitespace-nowrap px-3.5 py-2 text-[#D4D4D4] font-medium"
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
