import { Fragment, useMemo, useState } from 'react'
import { F, optionGroupCols, ROW_PRODUCT, type SallaRow } from '../lib/salla'
import type { RowMeta } from '../lib/build'
import { useI18n } from '../lib/i18n'
import { TextInput, Button, Select } from './ui'
import CategoryPicker from './CategoryPicker'
import ProductImagesEditor from './ProductImagesEditor'
import { showToast } from './Toast'

/** Product-level text fields the user can edit inline in the preview. */
const EDITABLE_TEXT_FIELDS = new Set<string>([F.name, F.price])

/** Salla's العنوان الترويجي hard length limit (import rejects longer values). */
const PROMO_TITLE_MAX = 25

type FilterMode = 'all' | 'products' | 'options' | 'noImages' | 'noCategory'

/** The three `[n] القيمة` headers, indexed by option slot (0..2). */
const OPTION_VALUE_COLS = [1, 2, 3].map((n) => optionGroupCols(n as 1 | 2 | 3).value)

/** Which option group a preview column belongs to, or -1 if it isn't one. */
function optionSlot(header: string): number {
  return OPTION_VALUE_COLS.indexOf(header)
}

/** A curated subset of the 40 columns worth showing, with i18n label keys. */
const PREVIEW_COLS: { header: string; labelKey: string }[] = [
  { header: F.type, labelKey: 'col.type' },
  { header: F.name, labelKey: 'col.name' },
  { header: F.price, labelKey: 'col.price' },
  { header: F.sku, labelKey: 'col.sku' },
  { header: F.category, labelKey: 'col.category' },
  { header: F.brand, labelKey: 'col.brand' },
  { header: F.promoTitle, labelKey: 'col.promoTitle' },
  { header: F.weight, labelKey: 'col.weight' },
  { header: OPTION_VALUE_COLS[0], labelKey: 'col.opt1' },
  { header: OPTION_VALUE_COLS[1], labelKey: 'col.opt2' },
  { header: OPTION_VALUE_COLS[2], labelKey: 'col.opt3' },
  { header: F.image, labelKey: 'col.images' },
]

export default function OutputPreview({
  rows,
  meta,
  categories,
  productCount,
  optionCount,
  excludedCount,
  removedOptionCount,
  onEditField,
  onApplyCategoryToAll,
  onDeleteItem,
  onRestoreAll,
  onRenameAxis,
  onEditOptionValue,
  onRemoveOptionValue,
}: {
  rows: SallaRow[]
  meta: RowMeta[]
  categories: string[]
  productCount: number
  optionCount: number
  excludedCount: number
  removedOptionCount: number
  onEditField: (sourceIndex: number, field: string, value: string) => void
  onApplyCategoryToAll: (value: string) => void
  onDeleteItem: (sourceIndex: number) => void
  onRestoreAll: () => void
  onRenameAxis: (sourceIndex: number, axisIndex: number, name: string) => void
  onEditOptionValue: (
    sourceIndex: number,
    axisIndex: number,
    original: string,
    value: string,
  ) => void
  onRemoveOptionValue: (sourceIndex: number, axisIndex: number, original: string) => void
}) {
  const { t } = useI18n()
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize, setPageSize] = useState<number>(15)
  const [page, setPage] = useState(1)
  const [bulkCategory, setBulkCategory] = useState('')
  const [imagesOpen, setImagesOpen] = useState<number | null>(null)

  // Compute key stats
  const missingImagesCount = useMemo(() => {
    return rows.filter((r) => r[F.type] === ROW_PRODUCT && !(r[F.image] ?? '').trim()).length
  }, [rows])

  const missingCategoryCount = useMemo(() => {
    return rows.filter((r) => r[F.type] === ROW_PRODUCT && !(r[F.category] ?? '').trim()).length
  }, [rows])

  // Filtered rows + meta pairing
  const filteredIndices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    const indices: number[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const isProduct = row[F.type] === ROW_PRODUCT

      // Filter by type
      if (filterMode === 'products' && !isProduct) continue
      if (filterMode === 'options' && isProduct) continue
      if (filterMode === 'noImages' && (!isProduct || (row[F.image] ?? '').trim().length > 0)) continue
      if (filterMode === 'noCategory' && (!isProduct || (row[F.category] ?? '').trim().length > 0)) continue

      // Search query
      if (q) {
        const name = (row[F.name] ?? '').toLowerCase()
        const sku = (row[F.sku] ?? '').toLowerCase()
        const opt1 = (row[OPTION_VALUE_COLS[0]] ?? '').toLowerCase()
        if (!name.includes(q) && !sku.includes(q) && !opt1.includes(q)) {
          continue
        }
      }

      indices.push(i)
    }
    return indices
  }, [rows, filterMode, searchQuery])

  const totalFiltered = filteredIndices.length
  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(totalFiltered / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = pageSize === 0 ? 0 : (currentPage - 1) * pageSize
  const endIndex = pageSize === 0 ? totalFiltered : Math.min(startIndex + pageSize, totalFiltered)
  const currentIndices = filteredIndices.slice(startIndex, endIndex)

  function handleApplyBulkCategory() {
    if (!bulkCategory) return
    onApplyCategoryToAll(bulkCategory)
    showToast(t('toast.categoryApplied', { n: productCount }), 'success')
  }

  function handleDelete(sourceIndex: number) {
    onDeleteItem(sourceIndex)
    showToast(t('toast.itemDeleted'), 'info')
  }

  function handleRestore() {
    onRestoreAll()
    showToast(t('toast.allRestored'), 'success')
  }

  return (
    <div className="space-y-4">
      {/* 1. Summary Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="hard-2 rounded-xl bg-white p-3 text-start">
          <span className="text-xs font-bold text-[color:var(--ink)]/60">
            {t('preview.statProducts')}
          </span>
          <p className="mt-0.5 text-xl font-black text-[color:var(--ink)]">
            {productCount}
          </p>
        </div>
        <div className="hard-2 rounded-xl bg-white p-3 text-start">
          <span className="text-xs font-bold text-[color:var(--ink)]/60">
            {t('preview.statOptions')}
          </span>
          <p className="mt-0.5 text-xl font-black text-[color:var(--ink)]">
            {optionCount}
          </p>
        </div>
        <div
          onClick={() => setFilterMode(missingImagesCount > 0 ? 'noImages' : 'all')}
          className={`hard-2 lift cursor-pointer rounded-xl p-3 text-start transition ${
            missingImagesCount > 0 ? 'bg-[color:var(--warning-tint)]' : 'bg-white'
          }`}
        >
          <span className="text-xs font-bold text-[color:var(--ink)]/60">
            {t('preview.statNoImages')}
          </span>
          <p className="mt-0.5 text-xl font-black text-[color:var(--ink)]">
            {missingImagesCount}
          </p>
        </div>
        <div
          onClick={() => setFilterMode(missingCategoryCount > 0 ? 'noCategory' : 'all')}
          className={`hard-2 lift cursor-pointer rounded-xl p-3 text-start transition ${
            missingCategoryCount > 0 ? 'bg-[color:var(--warning-tint)]' : 'bg-white'
          }`}
        >
          <span className="text-xs font-bold text-[color:var(--ink)]/60">
            {t('preview.statNoCategory')}
          </span>
          <p className="mt-0.5 text-xl font-black text-[color:var(--ink)]">
            {missingCategoryCount}
          </p>
        </div>
      </div>

      {/* 2. Bulk Category Tool */}
      {productCount > 0 && (
        <div className="hard-2 flex flex-wrap items-end gap-3 rounded-xl bg-white p-3.5">
          <div className="w-64">
            <label className="mb-1 block text-xs font-bold text-[color:var(--ink)]">
              {t('preview.applyAllLabel')}
            </label>
            <CategoryPicker
              value={bulkCategory}
              categories={categories}
              onChange={setBulkCategory}
            />
          </div>
          <Button onClick={handleApplyBulkCategory} disabled={!bulkCategory}>
            {t('preview.applyAllBtn')}
          </Button>
        </div>
      )}

      {/* 3. Filter & Search Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: 'all', label: t('preview.filterAll'), count: rows.length },
              { key: 'products', label: t('preview.filterProducts'), count: productCount },
              { key: 'options', label: t('preview.filterOptions'), count: optionCount },
              { key: 'noImages', label: t('preview.filterNoImages'), count: missingImagesCount },
              { key: 'noCategory', label: t('preview.filterNoCategory'), count: missingCategoryCount },
            ] as const
          ).map((tab) => {
            const active = filterMode === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setFilterMode(tab.key)
                  setPage(1)
                }}
                className={`hard-2 lift flex items-center gap-1.5 px-3 py-1 text-xs font-bold transition ${
                  active
                    ? 'bg-[color:var(--violet)] text-[color:var(--on-violet)]'
                    : 'bg-white text-[color:var(--ink)] hover:bg-[color:var(--cream)]'
                }`}
                style={{ borderRadius: 'var(--r-pill)' }}
              >
                <span>{tab.label}</span>
                <span className="rounded-full bg-black/10 px-1 text-[10px]">
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <TextInput
            value={searchQuery}
            placeholder={t('preview.searchPlaceholder')}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className="!py-1 !text-xs min-w-44"
          />
          <Select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            className="!py-1 !text-xs"
          >
            <option value={15}>{t('preview.pageSize', { n: 15 })}</option>
            <option value={30}>{t('preview.pageSize', { n: 30 })}</option>
            <option value={50}>{t('preview.pageSize', { n: 50 })}</option>
            <option value={0}>{t('preview.showAll', { n: rows.length })}</option>
          </Select>
        </div>
      </div>

      {/* 4. Restores banner if rows excluded */}
      {(excludedCount > 0 || removedOptionCount > 0) && (
        <div className="hard-2 flex items-center justify-between gap-3 rounded-xl bg-[color:var(--mustard)]/20 p-3 text-xs font-bold text-[color:var(--ink)]">
          <span>
            {excludedCount > 0 && t('preview.deletedInfo', { n: excludedCount })}
            {excludedCount > 0 && removedOptionCount > 0 && ' '}
            {removedOptionCount > 0 && t('preview.optRemovedInfo', { n: removedOptionCount })}
          </span>
          <Button variant="ghost" onClick={handleRestore} className="!py-1 !px-2.5 text-xs">
            {t('preview.restoreAll')}
          </Button>
        </div>
      )}

      {/* 5. Main Preview Table */}
      <div className="scroll-thin overflow-x-auto rounded-xl border-2 border-[color:var(--ink)] bg-white shadow-xs">
        <table className="min-w-full border-collapse text-xs">
          <thead className="bg-[color:var(--cream)] border-b-2 border-[color:var(--ink)]">
            <tr>
              <th className="px-3 py-2.5 text-start font-black text-[color:var(--ink)]">
                {t('preview.action')}
              </th>
              {PREVIEW_COLS.map((c) => (
                <th
                  key={c.header}
                  className="whitespace-nowrap px-3 py-2.5 text-start font-black text-[color:var(--ink)]"
                >
                  {t(c.labelKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {currentIndices.length === 0 ? (
              <tr>
                <td colSpan={PREVIEW_COLS.length + 1} className="py-8 text-center text-sm font-bold text-[color:var(--ink)]/50">
                  {t('qv.empty')}
                </td>
              </tr>
            ) : (
              currentIndices.map((i) => {
                const row = rows[i]
                const isProduct = row[F.type] === ROW_PRODUCT
                const rowMeta = meta[i]
                const editingImages = isProduct && rowMeta && imagesOpen === rowMeta.sourceIndex

                return (
                  <Fragment key={i}>
                    <tr className={isProduct ? 'bg-white hover:bg-black/[0.01]' : 'bg-[color:var(--cream)]/30 hover:bg-[color:var(--cream)]/50'}>
                      <td className="px-2 py-1.5 align-middle">
                        {isProduct && rowMeta ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(rowMeta.sourceIndex)}
                            title={t('preview.deleteTitle')}
                            className="rounded-md border border-[color:var(--coral)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--coral)] transition hover:bg-[color:var(--error-tint)]"
                          >
                            {t('btn.delete')}
                          </button>
                        ) : (
                          <span className="text-[10px] text-[color:var(--ink)]/30 font-bold">—</span>
                        )}
                      </td>
                      {PREVIEW_COLS.map((c) => {
                        // Category
                        if (c.header === F.category && isProduct && rowMeta) {
                          return (
                            <td key={c.header} className="px-2 py-1">
                              <CategoryPicker
                                value={row[F.category] ?? ''}
                                categories={categories}
                                className="min-w-32"
                                onChange={(next) =>
                                  onEditField(rowMeta.sourceIndex, F.category, next)
                                }
                              />
                            </td>
                          )
                        }

                        // Promo title
                        if (c.header === F.promoTitle && isProduct && rowMeta) {
                          const value = row[c.header] ?? ''
                          const over = value.length > PROMO_TITLE_MAX
                          return (
                            <td key={c.header} className="px-2 py-1">
                              <TextInput
                                value={value}
                                placeholder={t(c.labelKey)}
                                maxLength={PROMO_TITLE_MAX}
                                className="min-w-32 px-2 py-1 text-xs"
                                onChange={(e) =>
                                  onEditField(rowMeta.sourceIndex, F.promoTitle, e.target.value)
                                }
                              />
                              <span
                                className={
                                  'mt-0.5 block text-[10px] ' +
                                  (over ? 'font-black text-[color:var(--coral)]' : 'text-[color:var(--ink)]/40')
                                }
                              >
                                {value.length}/{PROMO_TITLE_MAX}
                              </span>
                            </td>
                          )
                        }

                        // Option groups
                        const slot = optionSlot(c.header)
                        if (slot >= 0 && rowMeta) {
                          const axis = isProduct ? rowMeta.axes?.[slot] : undefined
                          const pick = isProduct ? undefined : rowMeta.picks?.[slot]
                          if (axis) {
                            return (
                              <td key={c.header} className="px-2 py-1">
                                <TextInput
                                  value={axis.name}
                                  placeholder={t('opt.namePlaceholder')}
                                  title={t('preview.optNameTitle')}
                                  className="min-w-24 px-2 py-1 text-xs font-bold"
                                  onChange={(e) =>
                                    onRenameAxis(rowMeta.sourceIndex, axis.axisIndex, e.target.value)
                                  }
                                />
                              </td>
                            )
                          }
                          if (pick) {
                            return (
                              <td key={c.header} className="px-2 py-1">
                                <div className="flex items-center gap-1">
                                  <TextInput
                                    value={pick.value}
                                    className="min-w-20 px-2 py-1 text-xs"
                                    onChange={(e) =>
                                      onEditOptionValue(
                                        rowMeta.sourceIndex,
                                        pick.axisIndex,
                                        pick.original,
                                        e.target.value,
                                      )
                                    }
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onRemoveOptionValue(
                                        rowMeta.sourceIndex,
                                        pick.axisIndex,
                                        pick.original,
                                      )
                                    }
                                    title={t('preview.optRemoveTitle')}
                                    className="shrink-0 rounded-md border border-[color:var(--coral)] px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--coral)] transition hover:bg-[color:var(--error-tint)]"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </td>
                            )
                          }
                        }

                        // Images
                        if (c.header === F.image && isProduct && rowMeta) {
                          const count = (row[F.image] ?? '').split(',').filter(Boolean).length
                          return (
                            <td key={c.header} className="px-2 py-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setImagesOpen((cur) =>
                                    cur === rowMeta.sourceIndex ? null : rowMeta.sourceIndex,
                                  )
                                }
                                className={
                                  'whitespace-nowrap rounded-md border px-2 py-1 text-xs font-bold transition ' +
                                  (editingImages
                                    ? 'border-[color:var(--violet)] bg-[color:var(--violet)] text-white'
                                    : 'border-black/20 bg-white text-[color:var(--ink)] hover:bg-[color:var(--cream)]')
                                }
                              >
                                {t('preview.imagesBtn', { n: count })}
                              </button>
                            </td>
                          )
                        }

                        // Editable Name / price
                        if (EDITABLE_TEXT_FIELDS.has(c.header) && isProduct && rowMeta) {
                          return (
                            <td key={c.header} className="px-2 py-1">
                              <TextInput
                                value={row[c.header] ?? ''}
                                inputMode={c.header === F.price ? 'decimal' : undefined}
                                placeholder={t(c.labelKey)}
                                className="min-w-32 px-2 py-1 text-xs font-bold"
                                onChange={(e) =>
                                  onEditField(rowMeta.sourceIndex, c.header, e.target.value)
                                }
                              />
                            </td>
                          )
                        }

                        // Non-editable cell
                        const cellVal = row[c.header] ?? ''
                        return (
                          <td
                            key={c.header}
                            className="whitespace-nowrap px-3 py-1.5 text-[color:var(--ink)]/80"
                            title={cellVal}
                          >
                            {cellVal.length > 30 ? cellVal.slice(0, 30) + '…' : cellVal || '—'}
                          </td>
                        )
                      })}
                    </tr>

                    {/* Expandable Image Editor */}
                    {editingImages && isProduct && rowMeta && (
                      <tr className="bg-[color:var(--cream)]/60">
                        <td colSpan={PREVIEW_COLS.length + 1} className="p-3">
                          <ProductImagesEditor
                            value={row[F.image] ?? ''}
                            onChange={(next) => onEditField(rowMeta.sourceIndex, F.image, next)}
                            onClose={() => setImagesOpen(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 6. Pagination Footer */}
      {pageSize > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 pt-2">
          <span className="text-xs font-bold text-[color:var(--ink)]/60">
            صفحة {currentPage} من {totalPages} ({totalFiltered} صف)
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="!py-1 !px-2.5 text-xs"
            >
              السابق
            </Button>
            <Button
              variant="ghost"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="!py-1 !px-2.5 text-xs"
            >
              التالي
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
