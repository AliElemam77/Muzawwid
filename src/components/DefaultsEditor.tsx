import type { Defaults } from '../lib/types'
import { TextInput, Label } from './ui'

const FIELDS: { key: keyof Defaults; label: string; hint?: string }[] = [
  { key: 'productType', label: 'نوع المنتج' },
  { key: 'requiresShipping', label: 'هل يتطلب شحن؟' },
  { key: 'taxable', label: 'خاضع للضريبة ؟' },
  { key: 'weight', label: 'الوزن', hint: 'مطلوب من سلة — يُطبّق على كل صف فارغ' },
  { key: 'weightUnit', label: 'وحدة الوزن' },
  {
    key: 'maxQtyPerCustomer',
    label: 'اقصي كمية لكل عميل',
    hint: 'سلة ترفض الفارغ/الصفر — لازم ≥ 1. القيمة العالية = بلا حد عملي',
  },
]

/** Editable constant defaults applied to every row when the target cell is empty. */
export default function DefaultsEditor({
  defaults,
  onChange,
}: {
  defaults: Defaults
  onChange: (next: Defaults) => void
}) {
  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">
        قيم ثابتة تُملأ في كل صف (منتج وخيار) عندما تكون الخلية فارغة. الوزن مطلوب دائمًا من سلة.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map(({ key, label, hint }) => (
          <div key={key}>
            <Label>{label}</Label>
            <TextInput
              value={defaults[key]}
              onChange={(e) => onChange({ ...defaults, [key]: e.target.value })}
            />
            {hint && <p className="mt-1 text-xs text-amber-600">{hint}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
