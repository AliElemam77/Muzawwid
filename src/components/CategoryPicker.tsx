import { useEffect, useRef, useState } from 'react'
import {
  buildCategoryTree,
  flattenCategoryTree,
  parseCategoryCell,
  formatCategoryCell,
  dropCoveredAncestors,
} from '../lib/categories'
import { useI18n } from '../lib/i18n'

/** A full path back to its levels, for the formatter. */
const split = (path: string) => path.split(' > ')

/**
 * Pick one or MORE categories for a product from the store's category tree.
 * Sub-categories are shown nested and indented, so the user never types the
 * `>` separator — the value written back is the standard cell shape
 * (`نسائي > عبايات, اعياد`) that the exporter already understands.
 *
 * A value that isn't in the store list (came from the mapped sheet column) is
 * listed too and stays selected, so mapping work is never silently dropped.
 */
export default function CategoryPicker({
  value,
  categories,
  className = '',
  onChange,
}: {
  value: string
  categories: string[]
  className?: string
  onChange: (next: string) => void
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  // Close on an outside click / Escape — the panel floats over the table.
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const selected = dropCoveredAncestors(parseCategoryCell(value)).map((levels) =>
    levels.join(' > '),
  )
  const selectedSet = new Set(selected.map((p) => p.toLowerCase()))

  const nodes = flattenCategoryTree(buildCategoryTree(categories))
  const listed = new Set(nodes.map((n) => n.path.toLowerCase()))
  // Selected paths the store list doesn't know about — keep them togglable.
  const unlisted = selected.filter((p) => !listed.has(p.toLowerCase()))

  /**
   * A parent is off-limits once one of its sub-categories is picked: choosing
   * «الكترونيات > موبيل» already files the product under الكترونيات, so ticking
   * the parent on its own would only be noise. Uncheck the sub-category to free
   * the parent again.
   */
  function coveredBySub(path: string): boolean {
    const prefix = `${path.toLowerCase()} > `
    return selected.some((p) => p.toLowerCase().startsWith(prefix))
  }

  function toggle(path: string) {
    const key = path.toLowerCase()
    if (selectedSet.has(key)) {
      onChange(formatCategoryCell(selected.filter((p) => p.toLowerCase() !== key).map(split)))
      return
    }
    // Picking a sub-category supersedes its parents — drop them silently, and
    // drop anything nested below it too, so the selection never nests itself.
    const next = [
      ...selected.filter(
        (p) =>
          !key.startsWith(`${p.toLowerCase()} > `) && !p.toLowerCase().startsWith(`${key} > `),
      ),
      path,
    ]
    onChange(formatCategoryCell(next.map(split)))
  }

  const summary =
    selected.length === 0
      ? t('preview.catNone')
      : selected.length === 1
        ? selected[0]
        : t('preview.catCount', { n: selected.length })

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={selected.join('\n') || t('preview.catPick')}
        className={
          'w-full truncate border bg-white px-2 py-1 text-start text-xs transition ' +
          (selected.length
            ? 'border-[color:var(--ink)]/40 font-semibold'
            : 'border-[color:var(--ink)]/20 text-[color:var(--ink)]/50')
        }
        style={{ borderRadius: 'var(--r-input)' }}
      >
        {summary}
      </button>

      {open && (
        <div
          className="scroll-thin absolute z-30 mt-1 max-h-64 w-64 overflow-y-auto border border-[color:var(--ink)]/30 bg-white p-1 shadow-lg"
          style={{ borderRadius: 'var(--r-input)' }}
        >
          {nodes.length === 0 && unlisted.length === 0 && (
            <p className="px-2 py-2 text-xs text-[color:var(--ink)]/50">
              {t('preview.catEmptyList')}
            </p>
          )}

          {nodes.map((n) => {
            const covered = coveredBySub(n.path)
            return (
              <label
                key={n.path}
                title={covered ? t('preview.catCoveredBySub') : n.path}
                className={
                  'flex items-center gap-2 rounded px-2 py-1 text-xs ' +
                  (covered
                    ? 'cursor-not-allowed opacity-40'
                    : 'cursor-pointer hover:bg-[color:var(--ink)]/5')
                }
                style={{ paddingInlineStart: `${0.5 + n.depth * 0.9}rem` }}
              >
                <input
                  type="checkbox"
                  disabled={covered}
                  checked={selectedSet.has(n.path.toLowerCase())}
                  onChange={() => toggle(n.path)}
                />
                <span className={n.depth === 0 ? 'font-bold' : 'text-[color:var(--ink)]/80'}>
                  {n.depth > 0 && <span aria-hidden>↳ </span>}
                  {n.label}
                </span>
              </label>
            )
          })}

          {unlisted.map((p) => (
            <label
              key={p}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-[color:var(--ink)]/5"
            >
              <input type="checkbox" checked onChange={() => toggle(p)} />
              <span className="text-[color:var(--ink)]/60">
                {t('preview.catNotListed', { name: p })}
              </span>
            </label>
          ))}

          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="mt-1 w-full rounded px-2 py-1 text-xs font-bold text-red-600 transition hover:bg-red-50"
            >
              {t('preview.catClear')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
