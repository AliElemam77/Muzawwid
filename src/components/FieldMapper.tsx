import type { FieldSource } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { Select, TextInput } from './ui'

/** A clean, responsive Grid Card for mapping a single field. */
export default function FieldMapper({
  label,
  columns,
  source,
  required,
  sampleValues,
  onChange,
}: {
  label: string
  columns: string[]
  source: FieldSource
  required?: boolean
  sampleValues?: Record<string, string>
  onChange: (next: FieldSource) => void
}) {
  const { t } = useI18n()
  const isMapped =
    (source.kind === 'column' && !!source.column) ||
    (source.kind === 'constant' && !!source.value.trim())

  const sample =
    source.kind === 'column' && source.column && sampleValues
      ? sampleValues[source.column]
      : undefined

  return (
    <div
      className={`flex flex-col justify-between rounded-xl p-3.5 transition-all bg-[#141414] border ${
        required && !isMapped
          ? 'border-[#FF6B50]/40 bg-[#FF6B50]/10 shadow-sm'
          : isMapped
            ? 'border-[#12b3a4]/40 hover:border-[#12b3a4]/70'
            : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Header */}
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <span className="text-sm font-black text-white leading-tight">
          {label}
        </span>
        {required ? (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black border ${
              isMapped
                ? 'bg-[#12b3a4]/20 border-[#12b3a4]/40 text-[#2FE0CF]'
                : 'bg-[#FF6B50]/20 border-[#FF6B50]/40 text-[#FF856E]'
            }`}
          >
            {isMapped ? '✓ ' + t('field.requiredBadge') : t('field.requiredBadge') + ' *'}
          </span>
        ) : isMapped ? (
          <span className="shrink-0 rounded-full bg-[#12b3a4]/20 border border-[#12b3a4]/40 px-2 py-0.5 text-[10px] font-bold text-[#2FE0CF]">
            ✓
          </span>
        ) : null}
      </div>

      {/* Controls */}
      <div className="space-y-2">
        {/* Source Mode Toggle Buttons */}
        <div className="flex rounded-lg bg-[#1E1E1E] p-1 text-[11px] font-bold border border-white/10">
          <button
            type="button"
            onClick={() => onChange({ kind: 'column', column: columns[0] ?? '' })}
            className={`flex-1 rounded-md py-1 transition ${
              source.kind === 'column'
                ? 'bg-[#FF6B50] shadow-sm text-[#050505] font-black'
                : 'text-[#D4D4D4] hover:text-white'
            }`}
          >
            {t('field.column')}
          </button>
          <button
            type="button"
            onClick={() => onChange({ kind: 'constant', value: '' })}
            className={`flex-1 rounded-md py-1 transition ${
              source.kind === 'constant'
                ? 'bg-[#FF6B50] shadow-sm text-[#050505] font-black'
                : 'text-[#D4D4D4] hover:text-white'
            }`}
          >
            {t('field.constant')}
          </button>
          <button
            type="button"
            onClick={() => onChange({ kind: 'none' })}
            className={`flex-1 rounded-md py-1 transition ${
              source.kind === 'none'
                ? 'bg-[#FF6B50] shadow-sm text-[#050505] font-black'
                : 'text-[#D4D4D4] hover:text-white'
            }`}
          >
            {t('field.none')}
          </button>
        </div>

        {/* Dynamic Input based on Source */}
        {source.kind === 'column' && (
          <div className="space-y-1">
            <Select
              value={source.column}
              onChange={(e) => onChange({ kind: 'column', column: e.target.value })}
              className="!py-1.5 !text-xs w-full font-bold"
            >
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            {sample ? (
              <p
                className="truncate rounded-md bg-[#1A1A1A] px-2 py-0.5 text-[10px] font-medium text-[#D4D4D4] border border-white/5"
                title={sample}
              >
                {t('field.sample', { v: sample.length > 35 ? sample.slice(0, 35) + '…' : sample })}
              </p>
            ) : (
              <p className="text-[10px] text-[#888888] px-1">—</p>
            )}
          </div>
        )}

        {source.kind === 'constant' && (
          <TextInput
            value={source.value}
            placeholder={t('field.constantPlaceholder')}
            onChange={(e) => onChange({ kind: 'constant', value: e.target.value })}
            className="!py-1.5 !text-xs w-full font-bold"
          />
        )}

        {source.kind === 'none' && (
          <div className="flex h-14 items-center justify-center rounded-lg border border-dashed border-white/10 text-[11px] font-medium text-[#888888]">
            {t('qv.none')}
          </div>
        )}
      </div>
    </div>
  )
}
