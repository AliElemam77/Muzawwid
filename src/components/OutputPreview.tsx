import { useState } from 'react'
import { F, optionGroupCols, ROW_PRODUCT, type SallaRow } from '../lib/salla'
import type { RowMeta } from '../lib/build'
import { useI18n } from '../lib/i18n'
import { Select, TextInput, Button } from './ui'

/** Product-level text fields the user can edit inline in the preview. */
const EDITABLE_TEXT_FIELDS = new Set<string>([F.name, F.price])

const COLLAPSED_ROWS = 12

/** A curated subset of the 40 columns worth showing, with i18n label keys. */
const PREVIEW_COLS: { header: string; labelKey: string }[] = [
  { header: F.type, labelKey: 'col.type' },
  { header: F.name, labelKey: 'col.name' },
  { header: F.price, labelKey: 'col.price' },
  { header: F.sku, labelKey: 'col.sku' },
  { header: F.category, labelKey: 'col.category' }, // editable (see below)
  { header: F.brand, labelKey: 'col.brand' },
  { header: F.weight, labelKey: 'col.weight' },
  { header: optionGroupCols(1).value, labelKey: 'col.opt1' },
  { header: optionGroupCols(2).value, labelKey: 'col.opt2' },
  { header: optionGroupCols(3).value, labelKey: 'col.opt3' },
  { header: F.image, labelKey: 'col.images' },
]

/**
 * Live preview of the output rows. The «التصنيف» column is editable on منتج rows
 * and reports edits back as per-source-row category overrides.
 */
export default function OutputPreview({
  rows,
  meta,
  categories,
  productCount,
  optionCount,
  excludedCount,
  onEditField,
  onApplyCategoryToAll,
  onDeleteItem,
  onRestoreAll,
}: {
  rows: SallaRow[]
  meta: RowMeta[]
  categories: string[]
  productCount: number
  optionCount: number
  excludedCount: number
  onEditField: (sourceIndex: number, field: string, value: string) => void
  onApplyCategoryToAll: (value: string) => void
  onDeleteItem: (sourceIndex: number) => void
  onRestoreAll: () => void
}) {
  const { t } = useI18n()
  const [showAll, setShowAll] = useState(false)
  const [bulkCategory, setBulkCategory] = useState('')
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

      {excludedCount > 0 && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <span>{t('preview.deletedInfo', { n: excludedCount })}</span>
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
              return (
                <tr key={i} className={isProduct ? 'bg-white' : 'bg-indigo-50/50'}>
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
