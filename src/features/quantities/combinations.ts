import type { OptionGroup } from './types'

/**
 * Variant expansion for the quantities sheet.
 *
 * `build.ts` already has a cartesian product, but that one is welded to
 * `SourceRow`/`RowAxis` — it reads values out of a spreadsheet row. Here the
 * axes are typed in by hand in the UI and there is no source row at all, so
 * this stays a separate, dependency-free function rather than a shared one
 * bent to serve both.
 */

/** Between the product name and its option values: space, dash, space. */
const NAME_SEPARATOR = ' - '

/** Between option values: a bare slash, no spaces. */
const VALUE_SEPARATOR = '/'

/** Groups that contribute nothing — an axis with no values adds no variants. */
function usable(groups: OptionGroup[]): OptionGroup[] {
  return groups
    .map((g) => ({ ...g, values: g.values.map((v) => v.trim()).filter(Boolean) }))
    .filter((g) => g.values.length > 0)
}

/**
 * Every combination across the axes, as arrays of values.
 *
 * The FIRST group varies slowest, matching how Salla's own export orders them
 * (`White/40, White/42, White/44, Black/40, …`), so a merchant comparing the
 * two files side by side sees the same sequence.
 *
 * Returns `[]` — not `[[]]` — when nothing is expandable, so callers can treat
 * "no options" as "no variant rows" without a special case.
 */
export function combinations(groups: OptionGroup[]): string[][] {
  const axes = usable(groups)
  if (axes.length === 0) return []

  return axes.reduce<string[][]>(
    (acc, axis) => acc.flatMap((combo) => axis.values.map((value) => [...combo, value])),
    [[]],
  )
}

/** How many rows a set of axes will produce, without building them. */
export function combinationCount(groups: OptionGroup[]): number {
  const axes = usable(groups)
  return axes.length === 0 ? 0 : axes.reduce((n, axis) => n * axis.values.length, 1)
}

/** `بلوزة هاوس أوف يمينة - White/40` — the exact shape Salla writes. */
export function variantName(productName: string, values: string[]): string {
  return `${productName}${NAME_SEPARATOR}${values.join(VALUE_SEPARATOR)}`
}
