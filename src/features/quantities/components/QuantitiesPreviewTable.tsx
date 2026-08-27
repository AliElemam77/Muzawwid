import { useMemo, useRef, useState } from 'react'
import { useI18n } from '../../../lib/i18n'
import { Button, Select, TextInput } from '../../../components/ui'
import { normalizeArabic } from '../normalizeArabic'
import { removeRows, withVariants } from '../buildRows'
import { QUANTITY_HEADERS } from '../schema'
import {
  applyStockRule,
  LIMITED,
  ROW_PRODUCT,
  UNLIMITED,
  type QuantityRow,
  type Unlimited,
} from './../types'

/** checkbox · No. · النوع · الاسم · غير محدود الكمية · الكمية · حذف */
const COLUMNS = '2rem 7rem 4rem 1fr 7rem 7rem 2rem'
const ROW_HEIGHT = 40
const VIEWPORT_HEIGHT = 460
/** Rows rendered beyond the viewport so a fast scroll does not flash empty. */
const OVERSCAN = 6

type Filter = 'all' | 'products' | 'options'

/**
 * The editable quantities grid.
 *
 * Windowed by hand rather than with a virtualization library: the rows are a
 * fixed height and the list is flat, which is the one case where windowing is
 * a dozen lines — not worth a dependency for a single table.
 *
 * Only the quantity is editable. Everything else came from Salla and editing
 * it would break the match on the way back in — ids most of all.
 */
export default function QuantitiesPreviewTable({
  rows,
  onChange,
}: {
  rows: QuantityRow[]
  onChange: (rows: QuantityRow[]) => void
}) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set())
  const [bulk, setBulk] = useState('')
  const [undo, setUndo] = useState<QuantityRow[] | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const viewportRef = useRef<HTMLDivElement>(null)

  /** Indices into `rows` — kept as indices so edits address the real row. */
  const visible = useMemo(() => {
    const needle = normalizeArabic(search)
    const out: number[] = []
    rows.forEach((row, i) => {
      if (filter === 'products' && row.type !== ROW_PRODUCT) return
      if (filter === 'options' && row.type === ROW_PRODUCT) return
      if (needle && !normalizeArabic(row.name).includes(needle)) return
      out.push(i)
    })
    return out
  }, [rows, search, filter])

  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const last = Math.min(visible.length, first + Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2)
  const window = visible.slice(first, last)

  /** Edit one row, then let the stock rule settle the other cell. */
  function patch(index: number, change: Partial<QuantityRow>) {
    onChange(rows.map((row, i) => (i === index ? applyStockRule({ ...row, ...change }) : row)))
  }

  function setQuantity(index: number, raw: string) {
    const value = raw.trim()
    const parsed = Number(value)
    // Typing a number implies «لا» — the merchant should not have to set both.
    patch(index, {
      quantity: value === '' || Number.isNaN(parsed) ? '' : parsed,
      unlimited: value === '' ? rows[index].unlimited : LIMITED,
    })
  }

  const scopeOf = (target: 'all' | 'selected') =>
    new Set(target === 'all' ? visible : [...selected].filter((i) => visible.includes(i)))

  /** Bulk-set the quantity. Rows become limited, since they now carry a number. */
  function applyBulkQuantity(target: 'all' | 'selected') {
    const value = bulk.trim()
    const parsed = Number(value)
    if (value === '' || Number.isNaN(parsed)) return
    const scope = scopeOf(target)
    onChange(
      rows.map((row, i) =>
        scope.has(i) ? applyStockRule({ ...row, quantity: parsed, unlimited: LIMITED }) : row,
      ),
    )
  }

  /** Bulk-set «غير محدود الكمية»; quantities follow automatically. */
  function applyBulkUnlimited(target: 'all' | 'selected', unlimited: Unlimited) {
    const scope = scopeOf(target)
    onChange(rows.map((row, i) => (scope.has(i) ? applyStockRule({ ...row, unlimited }) : row)))
  }

  /**
   * Delete rows, keeping ONE step of undo. Deleting is the only destructive
   * thing in this table, and a mis-click on a product takes its variants with
   * it — so it must be reversible without re-uploading the file.
   */
  function remove(indices: Iterable<number>) {
    const next = removeRows(rows, indices)
    if (next.length === rows.length) return
    setUndo(rows)
    setSelected(new Set())
    onChange(next)
  }

  function toggle(index: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div>
      {/* --- Bulk tools ---------------------------------------------------- */}
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="min-w-[10rem] flex-1">
          <TextInput
            value={search}
            placeholder={t('qty.search')}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="max-w-[11rem]"
        >
          <option value="all">{t('qty.filter.all')}</option>
          <option value="products">{t('qty.filter.products')}</option>
          <option value="options">{t('qty.filter.options')}</option>
        </Select>
        <div className="max-w-[8rem]">
          <TextInput
            value={bulk}
            inputMode="numeric"
            placeholder={t('qty.bulkValue')}
            onChange={(e) => setBulk(e.target.value)}
          />
        </div>
        <Button variant="secondary" onClick={() => applyBulkQuantity('all')}>
          {t('qty.setAll')}
        </Button>
        <Button
          variant="ghost"
          onClick={() => applyBulkQuantity('selected')}
          disabled={selected.size === 0}
        >
          {t('qty.setSelected', { n: selected.size })}
        </Button>
      </div>

      {/* «غير محدود الكمية» in bulk — the switch that drives the numbers. */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-bold text-[color:var(--ink)]" style={{ fontSize: 'var(--fs-label)' }}>
          {QUANTITY_HEADERS[4]}:
        </span>
        <Button variant="secondary" onClick={() => applyBulkUnlimited('all', UNLIMITED)}>
          {t('qty.allUnlimited')}
        </Button>
        <Button variant="secondary" onClick={() => applyBulkUnlimited('all', LIMITED)}>
          {t('qty.allLimited')}
        </Button>
        {selected.size > 0 && (
          <>
            <Button variant="ghost" onClick={() => applyBulkUnlimited('selected', UNLIMITED)}>
              {t('qty.selectedUnlimited', { n: selected.size })}
            </Button>
            <Button variant="ghost" onClick={() => applyBulkUnlimited('selected', LIMITED)}>
              {t('qty.selectedLimited', { n: selected.size })}
            </Button>
          </>
        )}
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-3">
        <p className="text-[color:var(--ink)]/70" style={{ fontSize: 'var(--fs-label)' }}>
          {t('qty.showing', { shown: visible.length, total: rows.length })}
        </p>
        {selected.size > 0 && (
          <Button variant="danger" onClick={() => remove(selected)}>
            {t('qty.deleteSelected', { n: withVariants(rows, selected).size })}
          </Button>
        )}
        {undo && (
          <Button
            variant="ghost"
            onClick={() => {
              onChange(undo)
              setUndo(null)
            }}
          >
            {t('qty.undoDelete')}
          </Button>
        )}
      </div>

      {/* --- Header ------------------------------------------------------- */}
      <div
        className="grid items-center gap-2 border-2 border-[color:var(--ink)] bg-[color:var(--teal)] px-3 py-2 font-extrabold text-[color:var(--ink)]"
        style={{ gridTemplateColumns: COLUMNS, fontSize: 'var(--fs-label)' }}
      >
        <span />
        <span>{QUANTITY_HEADERS[0]}</span>
        <span>{QUANTITY_HEADERS[1]}</span>
        <span>{QUANTITY_HEADERS[2]}</span>
        <span>{QUANTITY_HEADERS[4]}</span>
        <span>{QUANTITY_HEADERS[5]}</span>
        <span />
      </div>

      {/* --- Windowed body ------------------------------------------------ */}
      <div
        ref={viewportRef}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        className="scroll-thin overflow-auto border-x-2 border-b-2 border-[color:var(--ink)] bg-white"
        style={{ height: VIEWPORT_HEIGHT }}
      >
        <div style={{ height: visible.length * ROW_HEIGHT, position: 'relative' }}>
          <div style={{ transform: `translateY(${first * ROW_HEIGHT}px)` }}>
            {window.map((index) => {
              const row = rows[index]
              const isParent = row.type === ROW_PRODUCT
              const unlimited = row.unlimited === UNLIMITED
              return (
                <div
                  key={index}
                  className="grid items-center gap-2 border-b border-[color:var(--ink)]/15 px-3"
                  style={{
                    gridTemplateColumns: COLUMNS,
                    height: ROW_HEIGHT,
                    fontSize: 'var(--fs-label)',
                    background: isParent ? 'color-mix(in srgb, var(--teal) 18%, white)' : undefined,
                  }}
                >
                  <input
                    type="checkbox"
                    className="accent-[color:var(--violet)]"
                    checked={selected.has(index)}
                    onChange={() => toggle(index)}
                    aria-label={row.name}
                  />
                  <span dir="ltr" className="truncate text-[color:var(--ink)]/60">
                    {row.no || '—'}
                  </span>
                  <span className="font-bold text-[color:var(--ink)]">{row.type}</span>
                  <span className="truncate text-[color:var(--ink)]" title={row.name}>
                    {row.name}
                  </span>
                  {/* The switch — editable on every row, product or variant. */}
                  <select
                    value={row.unlimited}
                    onChange={(e) => patch(index, { unlimited: e.target.value as Unlimited })}
                    aria-label={`${QUANTITY_HEADERS[4]} — ${row.name}`}
                    className="w-full border-2 border-[color:var(--ink)] bg-white px-1 py-1 font-bold text-[color:var(--ink)] outline-none"
                    style={{ borderRadius: 'var(--r-input)' }}
                  >
                    <option value={UNLIMITED}>{UNLIMITED}</option>
                    <option value={LIMITED}>{LIMITED}</option>
                  </select>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.quantity === '' ? '' : String(row.quantity)}
                    // Unlimited rows carry no number by definition, so the box
                    // is inert rather than silently ignored.
                    disabled={unlimited}
                    onChange={(e) => setQuantity(index, e.target.value)}
                    title={unlimited ? t('qty.unlimitedNoNumber') : undefined}
                    className="w-full border-2 border-[color:var(--ink)] bg-white px-2 py-1 text-[color:var(--ink)] outline-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-transparent"
                    style={{ borderRadius: 'var(--r-input)' }}
                  />
                  <button
                    type="button"
                    onClick={() => remove([index])}
                    // Deleting a product takes its variants with it, so say how
                    // many rows are about to go rather than just "delete".
                    title={t(isParent ? 'qty.deleteProduct' : 'qty.deleteRow', {
                      n: withVariants(rows, [index]).size,
                    })}
                    aria-label={t('qty.deleteRow', { n: 1 })}
                    className="font-extrabold text-[color:var(--ink)]/40 transition hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
