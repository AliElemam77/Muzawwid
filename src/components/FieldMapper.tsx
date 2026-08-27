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
      className={`hard-2 flex flex-col justify-between rounded-xl p-3.5 transition-all bg-white ${
        required && !isMapped
          ? 'border-[color:var(--mustard)] bg-[color:var(--warning-tint)]/40 shadow-xs'
          : isMapped
            ? 'border-[color:var(--ink)] hover:scale-[1.01]'
            : 'border-[color:var(--ink)]/30 opacity-90 hover:opacity-100'
      }`}
    >
      {/* Header */}
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <span className="text-sm font-black text-[color:var(--ink)] leading-tight">
          {label}
        </span>
        {required ? (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${
              isMapped
                ? 'bg-[color:var(--teal)]/20 border-[color:var(--teal)] text-[color:var(--ink)]'
                : 'bg-[color:var(--mustard)] border-[color:var(--ink)] text-[color:var(--ink)]'
            }`}
          >
            {isMapped ? '✓ ' + t('field.requiredBadge') : t('field.requiredBadge') + ' *'}
          </span>
        ) : isMapped ? (
          <span className="shrink-0 rounded-full bg-[color:var(--teal)]/15 border border-[color:var(--teal)]/40 px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--ink)]">
            ✓
          </span>
        ) : null}
      </div>

      {/* Controls */}
      <div className="space-y-2">
        {/* Source Mode Toggle Buttons */}
        <div className="flex rounded-lg bg-[color:var(--cream)]/60 p-0.5 text-[11px] font-bold border border-[color:var(--ink)]/15">
          <button
            type="button"
            onClick={() => onChange({ kind: 'column', column: columns[0] ?? '' })}
            className={`flex-1 rounded-md py-1 transition ${
              source.kind === 'column'
                ? 'bg-white shadow-xs text-[color:var(--ink)] font-black'
                : 'text-[color:var(--ink)]/60 hover:text-[color:var(--ink)]'
            }`}
          >
            {t('field.column')}
          </button>
          <button
            type="button"
            onClick={() => onChange({ kind: 'constant', value: '' })}
            className={`flex-1 rounded-md py-1 transition ${
              source.kind === 'constant'
                ? 'bg-white shadow-xs text-[color:var(--ink)] font-black'
                : 'text-[color:var(--ink)]/60 hover:text-[color:var(--ink)]'
            }`}
          >
            {t('field.constant')}
          </button>
          <button
            type="button"
            onClick={() => onChange({ kind: 'none' })}
            className={`flex-1 rounded-md py-1 transition ${
              source.kind === 'none'
                ? 'bg-white shadow-xs text-[color:var(--ink)] font-black'
                : 'text-[color:var(--ink)]/60 hover:text-[color:var(--ink)]'
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
                className="truncate rounded-md bg-[color:var(--cream)]/60 px-2 py-0.5 text-[10px] font-medium text-[color:var(--ink)]/75 border border-black/5"
                title={sample}
              >
                {t('field.sample', { v: sample.length > 35 ? sample.slice(0, 35) + '…' : sample })}
              </p>
            ) : (
              <p className="text-[10px] text-[color:var(--ink)]/40 px-1">—</p>
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
          <div className="flex h-14 items-center justify-center rounded-lg border border-dashed border-[color:var(--ink)]/15 text-[11px] font-medium text-[color:var(--ink)]/40">
            {t('qv.none')}
          </div>
        )}
      </div>
    </div>
  )
}
