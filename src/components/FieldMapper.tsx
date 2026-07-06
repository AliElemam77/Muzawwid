import type { FieldSource } from '../lib/types'
import { Select, TextInput } from './ui'

/** One Salla field's source control: بدون / عمود مصدر / قيمة ثابتة. */
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
  return (
    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_minmax(0,1.4fr)]">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="mr-1 text-red-500">*</span>}
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
        <option value="none">بدون</option>
        <option value="column">عمود مصدر</option>
        <option value="constant">قيمة ثابتة</option>
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
          placeholder="القيمة الثابتة لكل الصفوف"
          onChange={(e) => onChange({ kind: 'constant', value: e.target.value })}
        />
      )}
      {source.kind === 'none' && <span className="hidden sm:block" />}
    </div>
  )
}
