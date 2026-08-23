import { combinations, variantName } from './combinations'
import {
  applyStockRule,
  ROW_OPTION,
  ROW_PRODUCT,
  type GenerateConfig,
  type QuantityProduct,
  type QuantityRow,
} from './types'

/**
 * Turn products + option axes into the rows of a quantities sheet.
 *
 * Every row — product and variant alike — starts from the same setting and is
 * editable afterwards. `applyStockRule` keeps «غير محدود الكمية» and «الكمية»
 * consistent, so a row can never claim to be unlimited AND carry a number.
 *
 * Variant rows follow their parent immediately, with no blank row between.
 */
/**
 * Widen a selection to include each chosen product's variants.
 *
 * A «خيار» row belongs to the «منتج» row above it, so deleting a product on
 * its own would leave its variants behind as orphans pointing at a product
 * that is no longer in the sheet.
 */
export function withVariants(
  rows: readonly QuantityRow[],
  indices: Iterable<number>,
): Set<number> {
  const out = new Set(indices)
  for (const index of [...out]) {
    if (rows[index]?.type !== ROW_PRODUCT) continue
    for (let j = index + 1; j < rows.length && rows[j].type !== ROW_PRODUCT; j++) out.add(j)
  }
  return out
}

/** Drop rows (and any variants they own) from the sheet. */
export function removeRows(rows: QuantityRow[], indices: Iterable<number>): QuantityRow[] {
  const drop = withVariants(rows, indices)
  return rows.filter((_, i) => !drop.has(i))
}

export function buildQuantityRows(
  products: QuantityProduct[],
  { groups, defaultUnlimited, defaultQuantity }: GenerateConfig,
): QuantityRow[] {
  const combos = combinations(groups)
  const rows: QuantityRow[] = []

  for (const product of products) {
    const name = product.name.trim()
    if (!name) continue

    rows.push(
      applyStockRule({
        no: product.no ?? '',
        type: ROW_PRODUCT,
        name,
        sku: product.sku ?? '',
        unlimited: defaultUnlimited,
        quantity: defaultQuantity,
      }),
    )

    for (const values of combos) {
      rows.push(
        applyStockRule({
          // A variant's id belongs to the OPTION, not the product, and Salla
          // only mints it once the option exists in the store.
          no: '',
          type: ROW_OPTION,
          name: variantName(name, values),
          sku: '',
          unlimited: defaultUnlimited,
          quantity: defaultQuantity,
        }),
      )
    }
  }

  return rows
}
