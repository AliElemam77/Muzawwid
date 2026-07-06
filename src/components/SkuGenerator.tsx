import type { SkuConfig } from '../lib/types'
import { Select, TextInput, Label } from './ui'

const MODES: { mode: SkuConfig['mode']; label: string }[] = [
  { mode: 'none', label: 'بدون' },
  { mode: 'column', label: 'من عمود' },
  { mode: 'regex', label: 'استخراج من رابط /p(\\d+)' },
  { mode: 'auto', label: 'ترقيم تلقائي' },
]

/** Configure how رمز المنتج sku is produced. Variant sku = {parentSku}-{value}. */
export default function SkuGenerator({
  columns,
  sku,
  onChange,
}: {
  columns: string[]
  sku: SkuConfig
  onChange: (next: SkuConfig) => void
}) {
  function pickMode(mode: SkuConfig['mode']) {
    switch (mode) {
      case 'none':
        return onChange({ mode: 'none' })
      case 'column':
        return onChange({ mode: 'column', column: columns[0] ?? '' })
      case 'regex':
        return onChange({ mode: 'regex', column: columns[0] ?? '', prefix: '' })
      case 'auto':
        return onChange({ mode: 'auto', prefix: '' })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {MODES.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => pickMode(mode)}
            className={
              'rounded-lg px-3 py-1.5 text-sm font-semibold transition ' +
              (sku.mode === mode
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
            }
          >
            {label}
          </button>
        ))}
      </div>

      {sku.mode === 'column' && (
        <div className="max-w-sm">
          <Label>عمود الرمز</Label>
          <Select
            value={sku.column}
            onChange={(e) => onChange({ mode: 'column', column: e.target.value })}
          >
            {columns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
      )}

      {sku.mode === 'regex' && (
        <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>عمود الرابط</Label>
            <Select
              value={sku.column}
              onChange={(e) => onChange({ ...sku, column: e.target.value })}
            >
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>البادئة (Prefix)</Label>
            <TextInput
              value={sku.prefix}
              placeholder="مثال: SELIA-"
              onChange={(e) => onChange({ ...sku, prefix: e.target.value })}
            />
          </div>
          <p className="text-xs text-slate-500 sm:col-span-2">
            يُستخرج الرقم من الرابط عبر النمط <code className="rounded bg-slate-100 px-1">/p(\d+)</code> ويُدمج مع البادئة، مثال: <span dir="ltr">SELIA-12345</span>
          </p>
        </div>
      )}

      {sku.mode === 'auto' && (
        <div className="max-w-sm">
          <Label>البادئة (Prefix)</Label>
          <TextInput
            value={sku.prefix}
            placeholder="مثال: SKU-"
            onChange={(e) => onChange({ mode: 'auto', prefix: e.target.value })}
          />
          <p className="mt-1 text-xs text-slate-500">يُضاف رقم تسلسلي تلقائي لكل منتج: <span dir="ltr">SKU-1, SKU-2…</span></p>
        </div>
      )}
    </div>
  )
}
