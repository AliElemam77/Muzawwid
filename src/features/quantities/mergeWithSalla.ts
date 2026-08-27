import { normalizeArabic } from './normalizeArabic'
import { applyStockRule, LIMITED, type MergeReport, type QuantityRow } from './types'

/**
 * Pour a merchant's quantities into the sheet Salla exported.
 *
 * This is the trustworthy half of the feature. Salla's file is the ONLY source
 * of the `No.` ids, and an id is not something we can regenerate — so this
 * function treats those rows as immutable except for one cell: the quantity.
 * Row order, ids, names, SKUs all come out exactly as they went in.
 *
 * Matching is by name under `normalizeArabic`, which is also how a variant is
 * found: Salla names it «{product} - {v1}/{v2}», and so do we.
 */
export function mergeWithSalla(
  sallaRows: QuantityRow[],
  incoming: QuantityRow[],
): { rows: QuantityRow[]; report: MergeReport } {
  // First writer wins: if a merchant's sheet lists the same product twice,
  // silently taking the last number would hide the duplicate from them.
  const bySource = new Map<string, QuantityRow>()
  for (const row of incoming) {
    const key = normalizeArabic(row.name)
    if (key && !bySource.has(key)) bySource.set(key, row)
  }

  const used = new Set<string>()
  const unmatched: QuantityRow[] = []
  let matched = 0

  const rows = sallaRows.map((sallaRow) => {
    const key = normalizeArabic(sallaRow.name)
    const source = bySource.get(key)

    // No match, or the merchant left the quantity blank — either way there is
    // nothing to write, and overwriting with a blank would erase real stock.
    if (!source || source.quantity === '') {
      if (!source) unmatched.push(sallaRow)
      return sallaRow
    }

    used.add(key)
    matched++
    // A row given a number is by definition limited — the two settings are one
    // switch, so `applyStockRule` keeps them from contradicting each other.
    return applyStockRule({ ...sallaRow, quantity: source.quantity, unlimited: LIMITED })
  })

  const missingInStore = [...bySource.entries()]
    .filter(([key]) => !used.has(key))
    .map(([, row]) => row.name)

  return { rows, report: { matched, unmatched, missingInStore } }
}
