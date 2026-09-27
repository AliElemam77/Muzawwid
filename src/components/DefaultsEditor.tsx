import type { Defaults } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { TextInput } from './ui'

const FIELDS: { key: keyof Defaults; labelKey: string; hintKey?: string; required?: boolean }[] = [
  { key: 'weight', labelKey: 'f.weight', hintKey: 'defaults.weightHint', required: true },
  { key: 'weightUnit', labelKey: 'f.weightUnit', required: true },
  { key: 'productType', labelKey: 'f.productType' },
  { key: 'requiresShipping', labelKey: 'f.requiresShipping' },
  { key: 'taxable', labelKey: 'f.taxable' },
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
    <div className="space-y-4">
      <p className="text-xs font-medium text-[#D4D4D4]">{t('defaults.note')}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map(({ key, labelKey, hintKey, required }) => (
          <div
            key={key}
            className="flex flex-col justify-between rounded-xl bg-[#141414] border border-white/10 p-3.5 space-y-2"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-black text-white">
                {t(labelKey)}
              </span>
              {required && (
                <span className="rounded-full bg-[#ffc531]/20 border border-[#ffc531]/40 px-2 py-0.5 text-[10px] font-black text-[#ffd666]">
                  {t('field.requiredBadge')}
                </span>
              )}
            </div>
            <TextInput
              value={defaults[key]}
              onChange={(e) => onChange({ ...defaults, [key]: e.target.value })}
              className="!py-1.5 !text-xs font-bold"
            />
            {hintKey && (
              <p className="text-[10px] font-medium text-[#A3A3A3] leading-snug">
                {t(hintKey)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
