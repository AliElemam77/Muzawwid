import type { PriceField, PriceRule, QuantityConfig } from './types'

/**
 * Fixed/infinite quantity resolution. `source` keeps whatever the source row
 * had (today that is empty), `infinite` writes the literal `infinite`, and
 * `fixed` writes the configured number.
 */
export function resolveQuantity(sourceQty: string, q: QuantityConfig | undefined): string {
  if (!q) return sourceQty
  if (q.mode === 'infinite') return 'infinite'
  if (q.mode === 'fixed') return q.value.trim()
  return sourceQty
}

/** The three price fields a rule reads from / writes to. */
export interface Prices {
  price: string
  salePrice: string
  cost: string
}

/** Parse a price-ish string to a number, or null when it isn't numeric. */
function toNum(s: string): number | null {
  if (s == null) return null
  const t = String(s).trim()
  if (t === '') return null
  const n = Number(t.replace(/[,،\s]/g, ''))
  return Number.isFinite(n) ? n : null
}

/** Format a computed amount: round to 2 decimals and drop trailing zeros. */
function fmt(n: number): string {
  return String(Math.round(n * 100) / 100)
}

function compute(op: PriceRule['op'], src: number, value: number): number {
  switch (op) {
    case 'percentOff':
      return src * (1 - value / 100)
    case 'percentOf':
      return src * (value / 100)
    case 'multiply':
      return src * value
    case 'add':
      return src + value
    case 'subtract':
      return src - value
  }
}

/**
 * Apply price derivations in order. Each rule sets `target = source <op> value`,
 * reading the CURRENT values so a later rule can build on an earlier one. A rule
 * whose source or value isn't numeric is skipped (the field is left untouched);
 * negative results are clamped to 0.
 */
export function applyPriceRules(base: Prices, rules: readonly PriceRule[] = []): Prices {
  const out: Prices = { ...base }
  for (const rule of rules) {
    const src = toNum(out[rule.source])
    const value = toNum(rule.value)
    if (src === null || value === null) continue
    const result = compute(rule.op, src, value)
    out[rule.target] = fmt(result < 0 ? 0 : result)
  }
  return out
}

/** Human-readable operator symbols (used by the editor + previews). */
export const PRICE_OPS: { op: PriceRule['op']; symbol: string }[] = [
  { op: 'percentOff', symbol: '− %' },
  { op: 'percentOf', symbol: '% of' },
  { op: 'multiply', symbol: '×' },
  { op: 'add', symbol: '+' },
  { op: 'subtract', symbol: '−' },
]

export const PRICE_FIELDS: PriceField[] = ['price', 'salePrice', 'cost']
