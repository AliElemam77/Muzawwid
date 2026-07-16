import type { PriceField, PriceRule, QuantityConfig } from '../lib/types'
import { PRICE_OPS, PRICE_FIELDS } from '../lib/pricing'
import { useI18n } from '../lib/i18n'
import { Select, TextInput, Button, Label } from './ui'

const opSymbol = (op: PriceRule['op']) =>
  PRICE_OPS.find((o) => o.op === op)?.symbol ?? op

const DEFAULT_RULE: PriceRule = { target: 'salePrice', source: 'price', op: 'percentOff', value: '10' }

/**
 * Export-only options: ordered price derivations relating price / sale_price /
 * cost, plus (adapter platforms only) a fixed/infinite quantity for every row.
 *
 * `showQuantity` is false for Salla: its 40-column template has no quantity
 * column at all, so offering the control there would promise an export that
 * cannot happen. `fieldLabel` lets each platform name the three price fields in
 * its own terms — Salla's Arabic headers vs Zid's machine column keys.
 */
export default function ExportOptionsEditor({
  quantity,
  priceRules,
  fieldLabel,
  showQuantity = true,
  onQuantityChange,
  onPriceRulesChange,
}: {
  quantity: QuantityConfig
  priceRules: PriceRule[]
  fieldLabel: Record<PriceField, string>
  showQuantity?: boolean
  onQuantityChange: (next: QuantityConfig) => void
  onPriceRulesChange: (next: PriceRule[]) => void
}) {
  const { t } = useI18n()

  /** A one-line readout, e.g. `sale_price = price − 10%`. */
  const formula = (rule: PriceRule): string => {
    const suffix = rule.op === 'percentOff' || rule.op === 'percentOf' ? '%' : ''
    return `${fieldLabel[rule.target]} = ${fieldLabel[rule.source]} ${opSymbol(rule.op)} ${rule.value || '…'}${suffix}`
  }

  const setRule = (i: number, patch: Partial<PriceRule>) =>
    onPriceRulesChange(priceRules.map((r, k) => (k === i ? { ...r, ...patch } : r)))
  const addRule = () => onPriceRulesChange([...priceRules, { ...DEFAULT_RULE }])
  const removeRule = (i: number) => onPriceRulesChange(priceRules.filter((_, k) => k !== i))

  return (
    <div className="space-y-6">
      {/* Quantity */}
      {showQuantity && (
        <div>
          <Label>{t('qty.label')}</Label>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              className="max-w-xs"
              value={quantity.mode}
              onChange={(e) =>
                onQuantityChange({ ...quantity, mode: e.target.value as QuantityConfig['mode'] })
              }
            >
              <option value="source">{t('qty.mode.source')}</option>
              <option value="infinite">{t('qty.mode.infinite')}</option>
              <option value="fixed">{t('qty.mode.fixed')}</option>
            </Select>
            {quantity.mode === 'fixed' && (
              <TextInput
                className="max-w-[10rem]"
                type="number"
                min={0}
                placeholder={t('qty.fixedValue')}
                value={quantity.value}
                onChange={(e) => onQuantityChange({ ...quantity, value: e.target.value })}
              />
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">{t('qty.hint')}</p>
        </div>
      )}

      {/* Price rules */}
      <div>
        <Label>{t('price.label')}</Label>
        <p className="mb-3 text-xs text-slate-500">{t('price.hint')}</p>

        {priceRules.length === 0 ? (
          <p className="mb-3 text-sm text-slate-400">{t('price.empty')}</p>
        ) : (
          <div className="space-y-3">
            {priceRules.map((rule, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    className="max-w-[9rem]"
                    value={rule.target}
                    onChange={(e) => setRule(i, { target: e.target.value as PriceField })}
                  >
                    {PRICE_FIELDS.map((f) => (
                      <option key={f} value={f}>
                        {fieldLabel[f]}
                      </option>
                    ))}
                  </Select>
                  <span className="font-semibold text-slate-500">=</span>
                  <Select
                    className="max-w-[9rem]"
                    value={rule.source}
                    onChange={(e) => setRule(i, { source: e.target.value as PriceField })}
                  >
                    {PRICE_FIELDS.map((f) => (
                      <option key={f} value={f}>
                        {fieldLabel[f]}
                      </option>
                    ))}
                  </Select>
                  <Select
                    className="max-w-[7rem]"
                    value={rule.op}
                    onChange={(e) => setRule(i, { op: e.target.value as PriceRule['op'] })}
                  >
                    {PRICE_OPS.map((o) => (
                      <option key={o.op} value={o.op}>
                        {o.symbol}
                      </option>
                    ))}
                  </Select>
                  <TextInput
                    className="max-w-[7rem]"
                    type="number"
                    value={rule.value}
                    onChange={(e) => setRule(i, { value: e.target.value })}
                  />
                  <Button variant="danger" onClick={() => removeRule(i)}>
                    {t('price.remove')}
                  </Button>
                </div>
                <p className="mt-2 font-mono text-xs text-indigo-700" dir="ltr">
                  {formula(rule)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3">
          <Button variant="ghost" onClick={addRule}>
            {t('price.add')}
          </Button>
        </div>
      </div>
    </div>
  )
}
