import type { OptionColumn } from '../lib/types'
import type { OptionType } from '../lib/salla'
import { useI18n } from '../lib/i18n'
import { Select, TextInput, Label, Button } from './ui'

const TYPE_KEYS: { value: OptionType; key: string }[] = [
  { value: 'text', key: 'opt.type.text' },
  { value: 'color', key: 'opt.type.color' },
  { value: 'image', key: 'opt.type.image' },
]

/**
 * Declare up to 3 option (variant) columns. Each source option column expands
 * into one خيار row per value under its parent منتج row.
 */
export default function OptionsEditor({
  columns,
  options,
  onChange,
}: {
  columns: string[]
  options: OptionColumn[]
  onChange: (next: OptionColumn[]) => void
}) {
  const { t } = useI18n()
  function update(i: number, patch: Partial<OptionColumn>) {
    onChange(options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)))
  }
  function remove(i: number) {
    onChange(options.filter((_, idx) => idx !== i))
  }
  function add() {
    if (options.length >= 3) return
    onChange([...options, { column: columns[0] ?? '', name: '', type: 'text' }])
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{t('opt.note')}</p>

      {options.map((opt, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">{t('opt.group', { n: i + 1 })}</span>
            <Button variant="danger" onClick={() => remove(i)}>
              {t('btn.delete')}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>{t('opt.sourceCol')}</Label>
              <Select
                value={opt.column}
                onChange={(e) => update(i, { column: e.target.value })}
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>{t('opt.name')}</Label>
              <TextInput
                value={opt.name}
                placeholder={t('opt.namePlaceholder')}
                onChange={(e) => update(i, { name: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('opt.typeLabel')}</Label>
              <Select
                value={opt.type}
                onChange={(e) => update(i, { type: e.target.value as OptionType })}
              >
                {TYPE_KEYS.map((tk) => (
                  <option key={tk.value} value={tk.value}>
                    {t(tk.key)}
                  </option>
                ))}
              </Select>
            </div>
            {opt.type === 'color' && (
              <div>
                <Label>{t('opt.swatchLabel')}</Label>
                <Select
                  value={opt.swatchColumn ?? ''}
                  onChange={(e) =>
                    update(i, { swatchColumn: e.target.value || undefined })
                  }
                >
                  <option value="">{t('opt.swatchInfer')}</option>
                  {columns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        </div>
      ))}

      {options.length < 3 && (
        <Button variant="ghost" onClick={add}>
          {t('btn.addOption')}
        </Button>
      )}
    </div>
  )
}
