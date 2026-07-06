import type { Defaults } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { TextInput, Label } from './ui'

const FIELDS: { key: keyof Defaults; labelKey: string; hintKey?: string }[] = [
  { key: 'productType', labelKey: 'f.productType' },
  { key: 'requiresShipping', labelKey: 'f.requiresShipping' },
  { key: 'taxable', labelKey: 'f.taxable' },
  { key: 'weight', labelKey: 'f.weight', hintKey: 'defaults.weightHint' },
  { key: 'weightUnit', labelKey: 'f.weightUnit' },
  { key: 'maxQtyPerCustomer', labelKey: 'f.maxQty', hintKey: 'defaults.maxQtyHint' },
]

/** Editable constant defaults applied to every row when the target cell is empty. */
export default function DefaultsEditor({
  defaults,
  onChange,
}: {
  defaults: Defaults
  onChange: (next: Defaults) => void
}) {
  const { t } = useI18n()
  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">{t('defaults.note')}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map(({ key, labelKey, hintKey }) => (
          <div key={key}>
            <Label>{t(labelKey)}</Label>
            <TextInput
              value={defaults[key]}
              onChange={(e) => onChange({ ...defaults, [key]: e.target.value })}
            />
            {hintKey && <p className="mt-1 text-xs text-amber-600">{t(hintKey)}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
