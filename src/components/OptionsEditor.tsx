import type { OptionColumn } from '../lib/types'
import type { OptionType } from '../lib/salla'
import { useI18n } from '../lib/i18n'
import { Select, TextInput, Button } from './ui'
import OptionsVisualGuide from './OptionsVisualGuide'

const TYPE_KEYS: { value: OptionType; key: string; icon: string }[] = [
  { value: 'text', key: 'opt.type.text', icon: '📝' },
  { value: 'color', key: 'opt.type.color', icon: '🎨' },
  { value: 'image', key: 'opt.type.image', icon: '🖼️' },
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
      <p className="text-xs font-medium text-[color:var(--ink)]/70">{t('opt.note')}</p>
      <OptionsVisualGuide />

      {overLimit && (
        <div className="hard-2 rounded-xl bg-[color:var(--warning-tint)] p-3 text-xs font-bold text-[color:var(--ink)] border-[color:var(--mustard)]">
          ⚠️ {t('opt.tooMany', { count: axisCount, max: MAX_AXES })}
        </div>
      )}

      {options.map((opt, i) => (
        <div
          key={i}
          className="hard-2 rounded-xl bg-white p-4 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-[color:var(--ink)]/10 pb-2">
            <span className="text-xs font-black text-[color:var(--ink)]">
              {t('opt.group', { n: i + 1 })}
            </span>
            <Button variant="danger" onClick={() => remove(i)} className="!py-1 !px-2.5 text-xs">
              {t('btn.delete')}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[color:var(--ink)]">
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
              <label className="block text-xs font-bold text-[color:var(--ink)]">
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
              <label className="block text-xs font-bold text-[color:var(--ink)]">
                {t('opt.typeLabel')}
              </label>
              <Select
                value={opt.type}
                onChange={(e) => update(i, { type: e.target.value as OptionType })}
                className="!py-1.5 !text-xs font-bold"
              >
                {TYPE_KEYS.map((tk) => (
                  <option key={tk.value} value={tk.value}>
                    {tk.icon} {t(tk.key)}
                  </option>
                ))}
              </Select>
            </div>

            {opt.type === 'color' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[color:var(--ink)]">
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

      <Button variant="ghost" onClick={add} className="!py-1.5 !px-3 text-xs">
        {t('btn.addOption')}
      </Button>
    </div>
  )
}
