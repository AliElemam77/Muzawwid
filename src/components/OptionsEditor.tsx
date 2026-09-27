import { AlertTriangle } from 'lucide-react'
import type { OptionColumn } from '../lib/types'
import type { OptionType } from '../lib/salla'
import { useI18n } from '../lib/i18n'
import { Select, TextInput, Button } from './ui'
import OptionsVisualGuide from './OptionsVisualGuide'

const TYPE_KEYS: { value: OptionType; key: string }[] = [
  { value: 'text', key: 'opt.type.text' },
  { value: 'color', key: 'opt.type.color' },
  { value: 'image', key: 'opt.type.image' },
]

/** Max distinct option axes a target template (Salla/Zid) can hold. */
const MAX_AXES = 3

/** Distinct, non-empty option names (case/space-insensitive) = the real axes. */
function distinctAxisCount(options: OptionColumn[]): number {
  return new Set(
    options.map((o) => o.name.trim().replace(/\s+/g, ' ').toLowerCase()).filter(Boolean),
  ).size
}

/**
 * Declare option (variant) columns. Multiple columns that share the SAME name
 * merge into ONE axis. Each option value expands into one خيار row under its parent منتج row.
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
    const lastName = options[options.length - 1]?.name ?? ''
    onChange([...options, { column: columns[0] ?? '', name: lastName, type: 'text' }])
  }

  const axisCount = distinctAxisCount(options)
  const overLimit = axisCount > MAX_AXES

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-[#D4D4D4]">{t('opt.note')}</p>
      <OptionsVisualGuide />

      {overLimit && (
        <div className="rounded-xl border border-[#ffc531]/40 bg-[#ffc531]/10 p-3 text-xs font-bold text-[#ffd666] flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0 text-[#ffc531]" />
          <span>{t('opt.tooMany', { count: axisCount, max: MAX_AXES })}</span>
        </div>
      )}

      {options.map((opt, i) => (
        <div
          key={i}
          className="rounded-xl bg-[#141414] border border-white/10 p-4 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-black text-white">
              {t('opt.group', { n: i + 1 })}
            </span>
            <Button variant="danger" onClick={() => remove(i)} className="!py-1 !px-2.5 text-xs">
              {t('btn.delete')}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-white">
                {t('opt.sourceCol')}
              </label>
              <Select
                value={opt.column}
                onChange={(e) => update(i, { column: e.target.value })}
                className="!py-1.5 !text-xs font-bold"
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-white">
                {t('opt.name')}
              </label>
              <TextInput
                value={opt.name}
                placeholder={t('opt.namePlaceholder')}
                onChange={(e) => update(i, { name: e.target.value })}
                className="!py-1.5 !text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-white">
                {t('opt.typeLabel')}
              </label>
              <Select
                value={opt.type}
                onChange={(e) => update(i, { type: e.target.value as OptionType })}
                className="!py-1.5 !text-xs font-bold"
              >
                {TYPE_KEYS.map((tk) => (
                  <option key={tk.value} value={tk.value}>
                    {t(tk.key)}
                  </option>
                ))}
              </Select>
            </div>

            {opt.type === 'color' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-white">
                  {t('opt.swatchLabel')}
                </label>
                <Select
                  value={opt.swatchColumn ?? ''}
                  onChange={(e) =>
                    update(i, { swatchColumn: e.target.value || undefined })
                  }
                  className="!py-1.5 !text-xs font-bold"
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

      <Button variant="ghost" onClick={add} className="!py-1.5 !px-3 text-xs !border-white/15 !text-white hover:!bg-white/10">
        {t('btn.addOption')}
      </Button>
    </div>
  )
}
