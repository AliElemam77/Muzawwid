import { useState } from 'react'
import { F, optionGroupCols, ROW_PRODUCT, type SallaRow } from '../lib/salla'
import type { RowMeta } from '../lib/build'
import { Select, TextInput, Button } from './ui'

/** Product-level text fields the user can edit inline in the preview. */
const EDITABLE_TEXT_FIELDS = new Set<string>([F.name, F.price])

const COLLAPSED_ROWS = 12

/** A curated subset of the 40 columns worth showing in the live preview. */
const PREVIEW_COLS: { header: string; label: string }[] = [
  { header: F.type, label: 'النوع' },
  { header: F.name, label: 'أسم المنتج' },
  { header: F.price, label: 'السعر' },
  { header: F.sku, label: 'SKU' },
  { header: F.category, label: 'التصنيف' }, // editable (see below)
  { header: F.brand, label: 'الماركة' },
  { header: F.weight, label: 'الوزن' },
  { header: optionGroupCols(1).value, label: '[1] القيمة' },
  { header: optionGroupCols(2).value, label: '[2] القيمة' },
  { header: optionGroupCols(3).value, label: '[3] القيمة' },
  { header: F.image, label: 'الصور' },
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
  const [showAll, setShowAll] = useState(false)
  const [bulkCategory, setBulkCategory] = useState('')
  const limit = showAll ? rows.length : COLLAPSED_ROWS
  const shown = rows.slice(0, limit)

  return (
    <div>
      <p className="mb-2 text-sm text-slate-500">
        {productCount} منتج · {optionCount} خيار · {rows.length} صف إجمالًا — يظهر {shown.length}.
        أعمدة «الاسم» و«السعر» و«التصنيف» قابلة للتعديل على المنتجات، وزر «حذف» يزيل البند بكل خياراته.
      </p>

      {productCount > 0 && (
        <div className="mb-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="w-56">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              تطبيق تصنيف على كل المنتجات
            </label>
            <Select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
            >
              <option value="">— بدون —</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={() => onApplyCategoryToAll(bulkCategory)}>
            تطبيق على الكل
          </Button>
        </div>
      )}

      {excludedCount > 0 && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <span>تم حذف {excludedCount} بند من التصدير.</span>
          <Button variant="ghost" onClick={onRestoreAll}>
            استرجاع الكل
          </Button>
        </div>
      )}
      <div className="scroll-thin overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="border-b border-slate-200 px-3 py-2 text-right font-semibold text-slate-700">
                إجراء
              </th>
              {PREVIEW_COLS.map((c) => (
                <th
                  key={c.header}
                  className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-right font-semibold text-slate-700"
                >
                  {c.label}
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
                        title="حذف هذا البند بكل خياراته"
                        className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        حذف
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
                            <option value="">— بدون —</option>
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                            {extra && (
                              <option value={extra}>{extra} (غير مُدرج)</option>
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
                            placeholder={c.label}
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
            {showAll ? 'عرض أقل' : `عرض كل الصفوف (${rows.length}) لتعديل كل التصنيفات`}
          </Button>
        </div>
      )}
    </div>
  )
}
