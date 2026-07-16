import { Fragment, useState } from 'react'
import { F, optionGroupCols, ROW_PRODUCT, type SallaRow } from '../lib/salla'
import type { RowMeta } from '../lib/build'
import { useI18n } from '../lib/i18n'
import { Select, TextInput, Button } from './ui'
import ProductImagesEditor from './ProductImagesEditor'

/** Product-level text fields the user can edit inline in the preview. */
const EDITABLE_TEXT_FIELDS = new Set<string>([F.name, F.price])

/** Salla's العنوان الترويجي hard length limit (import rejects longer values). */
const PROMO_TITLE_MAX = 25

const COLLAPSED_ROWS = 12

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
  { header: F.category, labelKey: 'col.category' }, // editable (see below)
  { header: F.brand, labelKey: 'col.brand' },
  { header: F.promoTitle, labelKey: 'col.promoTitle' }, // editable (see below)
  { header: F.weight, labelKey: 'col.weight' },
  { header: OPTION_VALUE_COLS[0], labelKey: 'col.opt1' }, // editable (see below)
  { header: OPTION_VALUE_COLS[1], labelKey: 'col.opt2' },
  { header: OPTION_VALUE_COLS[2], labelKey: 'col.opt3' },
  { header: F.image, labelKey: 'col.images' }, // editable (see below)
]

/**
 * Live preview of the output rows, and the place where per-product fixes are
 * made: category/name/price/promo-title inline, the option axes and values on
 * their own rows, and the image list in an expandable editor.
 */
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
  const [showAll, setShowAll] = useState(false)
  const [bulkCategory, setBulkCategory] = useState('')
  /** Source index whose image editor is expanded (only one at a time). */
  const [imagesOpen, setImagesOpen] = useState<number | null>(null)
  const limit = showAll ? rows.length : COLLAPSED_ROWS
  const shown = rows.slice(0, limit)

  return (
    <div>
      <p className="mb-2 text-sm text-slate-500">
        {t('preview.stats', {
          products: productCount,
          options: optionCount,
          total: rows.length,
          shown: shown.length,
        })}{' '}
        {t('preview.editNote')}
      </p>

      {productCount > 0 && (
        <div className="mb-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="w-56">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              {t('preview.applyAllLabel')}
            </label>
            <Select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
            >
              <option value="">{t('preview.catNone')}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={() => onApplyCategoryToAll(bulkCategory)}>
            {t('preview.applyAllBtn')}
          </Button>
        </div>
      )}

      {(excludedCount > 0 || removedOptionCount > 0) && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <span>
            {excludedCount > 0 && t('preview.deletedInfo', { n: excludedCount })}
            {excludedCount > 0 && removedOptionCount > 0 && ' '}
            {removedOptionCount > 0 && t('preview.optRemovedInfo', { n: removedOptionCount })}
          </span>
          <Button variant="ghost" onClick={onRestoreAll}>
            {t('preview.restoreAll')}
          </Button>
        </div>
      )}
      <div className="scroll-thin overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="border-b border-slate-200 px-3 py-2 text-start font-semibold text-slate-700">
                {t('preview.action')}
              </th>
              {PREVIEW_COLS.map((c) => (
                <th
                  key={c.header}
                  className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-start font-semibold text-slate-700"
                >
                  {t(c.labelKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => {
              const isProduct = row[F.type] === ROW_PRODUCT
              const rowMeta = meta[i]
              const editingImages = isProduct && rowMeta && imagesOpen === rowMeta.sourceIndex
              return (
                <Fragment key={i}>
                  <tr className={isProduct ? 'bg-white' : 'bg-indigo-50/50'}>
                    <td className="border-b border-slate-100 px-2 py-1 align-middle">
                      {isProduct && rowMeta ? (
                        <button
                          onClick={() => onDeleteItem(rowMeta.sourceIndex)}
                          title={t('preview.deleteTitle')}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          {t('btn.delete')}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    {PREVIEW_COLS.map((c) => {
                      // Category → dropdown from the store list (products only).
                      if (c.header === F.category && isProduct && rowMeta) {
                        const current = row[F.category] ?? ''
                        // Keep a mapped value that isn't in the store list selectable.
                        const extra = current && !categories.includes(current) ? current : null
                        return (
                          <td key={c.header} className="border-b border-slate-100 px-2 py-1">
                            <Select
                              value={current}
                              className="min-w-32 px-2 py-1 text-xs"
                              onChange={(e) =>
                                onEditField(rowMeta.sourceIndex, F.category, e.target.value)
                              }
                            >
                              <option value="">{t('preview.catNone')}</option>
                              {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                              {extra && (
                                <option value={extra}>{t('preview.catNotListed', { name: extra })}</option>
                              )}
                            </Select>
                          </td>
                        )
                      }
                      // العنوان الترويجي → free-text input with a live char counter
                      // (Salla rejects import over 25 chars; export also clamps).
                      if (c.header === F.promoTitle && isProduct && rowMeta) {
                        const value = row[c.header] ?? ''
                        const over = value.length > PROMO_TITLE_MAX
                        return (
                          <td key={c.header} className="border-b border-slate-100 px-2 py-1">
                            <TextInput
                              value={value}
                              placeholder={t(c.labelKey)}
                              // Stop typing at the limit — otherwise the export
                              // clamp would swallow the word being typed.
                              maxLength={PROMO_TITLE_MAX}
                              className="min-w-32 px-2 py-1 text-xs"
                              onChange={(e) =>
                                onEditField(rowMeta.sourceIndex, F.promoTitle, e.target.value)
                              }
                            />
                            <span
                              className={
                                'mt-0.5 block text-[10px] ' +
                                (over ? 'font-semibold text-red-600' : 'text-slate-400')
                              }
                            >
                              {value.length}/{PROMO_TITLE_MAX}
                            </span>
                          </td>
                        )
                      }
                      // Option groups. On a منتج row the value cell only holds
                      // Salla's placeholder, so we show the axis NAME there and
                      // make it editable; on a خيار row we edit the value itself.
                      const slot = optionSlot(c.header)
                      if (slot >= 0 && rowMeta) {
                        const axis = isProduct ? rowMeta.axes?.[slot] : undefined
                        const pick = isProduct ? undefined : rowMeta.picks?.[slot]
                        if (axis) {
                          return (
                            <td key={c.header} className="border-b border-slate-100 px-2 py-1">
                              <TextInput
                                value={axis.name}
                                placeholder={t('opt.namePlaceholder')}
                                title={t('preview.optNameTitle')}
                                className="min-w-24 px-2 py-1 text-xs font-semibold"
                                onChange={(e) =>
                                  onRenameAxis(rowMeta.sourceIndex, axis.axisIndex, e.target.value)
                                }
                              />
                            </td>
                          )
                        }
                        if (pick) {
                          return (
                            <td key={c.header} className="border-b border-slate-100 px-2 py-1">
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
                                  onClick={() =>
                                    onRemoveOptionValue(
                                      rowMeta.sourceIndex,
                                      pick.axisIndex,
                                      pick.original,
                                    )
                                  }
                                  title={t('preview.optRemoveTitle')}
                                  className="shrink-0 rounded-md border border-red-200 px-1.5 py-1 text-[10px] font-bold text-red-600 transition hover:bg-red-50"
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                          )
                        }
                      }
                      // Images → count chip that opens the per-product editor.
                      if (c.header === F.image && isProduct && rowMeta) {
                        const count = (row[F.image] ?? '').split(',').filter(Boolean).length
                        return (
                          <td key={c.header} className="border-b border-slate-100 px-2 py-1">
                            <button
                              onClick={() =>
                                setImagesOpen((cur) =>
                                  cur === rowMeta.sourceIndex ? null : rowMeta.sourceIndex,
                                )
                              }
                              className={
                                'whitespace-nowrap rounded-md border px-2 py-1 text-xs font-semibold transition ' +
                                (editingImages
                                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50')
                              }
                            >
                              {t('preview.imagesBtn', { n: count })}
                            </button>
                          </td>
                        )
                      }
                      // Name / price → free-text input (products only).
                      if (EDITABLE_TEXT_FIELDS.has(c.header) && isProduct && rowMeta) {
                        return (
                          <td key={c.header} className="border-b border-slate-100 px-2 py-1">
                            <TextInput
                              value={row[c.header] ?? ''}
                              inputMode={c.header === F.price ? 'decimal' : undefined}
                              placeholder={t(c.labelKey)}
                              className="min-w-28 px-2 py-1 text-xs"
                              onChange={(e) =>
                                onEditField(rowMeta.sourceIndex, c.header, e.target.value)
                              }
                            />
                          </td>
                        )
                      }
                      return (
                        <td
                          key={c.header}
                          className={
                            'max-w-56 truncate whitespace-nowrap border-b border-slate-100 px-3 py-2 ' +
                            (c.header === F.type
                              ? isProduct
                                ? 'font-bold text-slate-800'
                                : 'font-semibold text-indigo-600'
                              : 'text-slate-600')
                          }
                          title={row[c.header]}
                        >
                          {row[c.header] ?? ''}
                        </td>
                      )
                    })}
                  </tr>
                  {editingImages && rowMeta && (
                    <tr className="bg-white">
                      <td colSpan={PREVIEW_COLS.length + 1} className="border-b border-slate-100 px-2 py-2">
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
            })}
          </tbody>
        </table>
      </div>

      {rows.length > COLLAPSED_ROWS && (
        <div className="mt-3">
          <Button variant="ghost" onClick={() => setShowAll((s) => !s)}>
            {showAll ? t('preview.showLess') : t('preview.showAll', { n: rows.length })}
          </Button>
        </div>
      )}
    </div>
  )
}
