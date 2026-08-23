import type { PriceField, PriceRule, QuantityConfig } from '../lib/types'
import { PRICE_OPS, PRICE_FIELDS } from '../lib/pricing'
import { useI18n } from '../lib/i18n'
import { Select, TextInput, Button } from './ui'

const opSymbol = (op: PriceRule['op']) =>
  PRICE_OPS.find((o) => o.op === op)?.symbol ?? op

const DEFAULT_RULE: PriceRule = { target: 'salePrice', source: 'price', op: 'percentOff', value: '10' }

/**
 * Export-only options: ordered price derivations relating price / sale_price /
 * cost, plus (adapter platforms only) a fixed/infinite quantity for every row.
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
        <div className="hard-2 rounded-xl bg-white p-4 space-y-2">
          <label className="block text-xs font-black text-[color:var(--ink)]">
            {t('qty.label')}
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              className="max-w-xs !py-1.5 !text-xs font-bold"
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
                className="max-w-[10rem] !py-1.5 !text-xs font-bold"
                type="number"
                min={0}
                placeholder={t('qty.fixedValue')}
                value={quantity.value}
                onChange={(e) => onQuantityChange({ ...quantity, value: e.target.value })}
              />
            )}
          </div>
          <p className="text-xs font-medium text-[color:var(--ink)]/60">{t('qty.hint')}</p>
        </div>
      )}

      {/* Price rules */}
      <div className="space-y-3">
        <label className="block text-xs font-black text-[color:var(--ink)]">
          {t('price.label')}
        </label>
        <p className="text-xs font-medium text-[color:var(--ink)]/70">{t('price.hint')}</p>

        {priceRules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[color:var(--ink)]/20 p-4 text-center text-xs font-bold text-[color:var(--ink)]/50">
            {t('price.empty')}
          </div>
        ) : (
          <div className="space-y-3">
            {priceRules.map((rule, i) => (
              <div key={i} className="hard-2 rounded-xl bg-white p-3.5 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    className="max-w-[9.5rem] !py-1.5 !text-xs font-bold"
                    value={rule.target}
                    onChange={(e) => setRule(i, { target: e.target.value as PriceField })}
                  >
                    {PRICE_FIELDS.map((f) => (
                      <option key={f} value={f}>
                        {fieldLabel[f]}
                      </option>
                    ))}
                  </Select>
                  <span className="font-black text-sm text-[color:var(--ink)]">=</span>
                  <Select
                    className="max-w-[9.5rem] !py-1.5 !text-xs font-bold"
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
                    className="max-w-[6.5rem] !py-1.5 !text-xs font-bold"
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
                    className="max-w-[6.5rem] !py-1.5 !text-xs font-bold"
                    type="number"
                    value={rule.value}
                    onChange={(e) => setRule(i, { value: e.target.value })}
                  />
                  <Button variant="danger" onClick={() => removeRule(i)} className="!py-1 !px-2.5 text-xs">
                    {t('price.remove')}
                  </Button>
                </div>
                <div className="rounded-md bg-[color:var(--cream)]/60 p-2 font-mono text-xs font-bold text-[color:var(--ink)] border border-black/5" dir="ltr">
                  {formula(rule)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <Button variant="ghost" onClick={addRule} className="!py-1.5 !px-3 text-xs">
            {t('price.add')}
          </Button>
        </div>
      </div>
    </div>
  )
}
