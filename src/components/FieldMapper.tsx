import type { FieldSource } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { Select, TextInput } from './ui'

/** One Salla field's source control: None / Source column / Constant value. */
export default function FieldMapper({
  label,
  columns,
  source,
  required,
  onChange,
}: {
  label: string
  columns: string[]
  source: FieldSource
  required?: boolean
  onChange: (next: FieldSource) => void
}) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_minmax(0,1.4fr)]">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="mx-1 text-red-500">*</span>}
      </span>

      <Select
        value={source.kind}
        onChange={(e) => {
          const kind = e.target.value as FieldSource['kind']
          if (kind === 'none') onChange({ kind: 'none' })
          else if (kind === 'column') onChange({ kind: 'column', column: columns[0] ?? '' })
          else onChange({ kind: 'constant', value: '' })
        }}
      >
        <option value="none">{t('field.none')}</option>
        <option value="column">{t('field.column')}</option>
        <option value="constant">{t('field.constant')}</option>
      </Select>

      {source.kind === 'column' && (
        <Select
          value={source.column}
          onChange={(e) => onChange({ kind: 'column', column: e.target.value })}
        >
          {columns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      )}
      {source.kind === 'constant' && (
        <TextInput
          value={source.value}
          placeholder={t('field.constantPlaceholder')}
          onChange={(e) => onChange({ kind: 'constant', value: e.target.value })}
        />
      )}
      {source.kind === 'none' && <span className="hidden sm:block" />}
    </div>
  )
}
