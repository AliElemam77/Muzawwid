import { useState } from 'react'
import type { SourcedProduct } from '../lib/product'
import { F } from '../lib/salla'
import { useI18n } from '../lib/i18n'
import { Select, TextInput, Button } from './ui'

const COLLAPSED_ROWS = 12

/**
 * Preview of the canonical products destined for Zid (one row each), with the
 * same inline editing as the Salla preview: name / price / category, apply a
 * category to all, delete an item, restore, and show-all.
 */

export default function ZidPreview({
  products,
  categories,
  excludedCount,
  onEditField,
  onApplyCategoryToAll,
  onDeleteItem,
  onRestoreAll,
}: {
  products: SourcedProduct[]
  categories: string[]
  excludedCount: number
  onEditField: (sourceIndex: number, field: string, value: string) => void
  onApplyCategoryToAll: (value: string) => void
  onDeleteItem: (sourceIndex: number) => void
  onRestoreAll: () => void
}) {
  const { t } = useI18n()
  const [showAll, setShowAll] = useState(false)
  const [bulkCategory, setBulkCategory] = useState('')
  const shown = showAll ? products : products.slice(0, COLLAPSED_ROWS)

  return (
    <div>
      <p className="mb-2 text-sm text-slate-500">
        {t('zid.stats', { count: products.length })} {t('preview.editNote')}
      </p>

      {products.length > 0 && (
        <div className="mb-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="w-56">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              {t('preview.applyAllLabel')}
            </label>
            <Select value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}>
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
              {[
                t('preview.action'),
                t('col.sku'),
                t('col.name'),
                t('col.price'),
                t('col.weight'),
                t('col.category'),
                t('col.variants'),
                t('col.options'),
                t('col.images'),
              ].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-start font-semibold text-slate-700"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => {
              const opts = p.options.filter((o) => o.values.length > 0)
              const cat = p.categoriesAr
              const extraCat = cat && !categories.includes(cat) ? cat : null
              return (
                <tr key={p.sourceIndex} className="odd:bg-white even:bg-slate-50/50">
                  <td className="border-b border-slate-100 px-2 py-1">
                    <button
                      onClick={() => onDeleteItem(p.sourceIndex)}
                      title={t('preview.deleteTitle')}
                      className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      {t('btn.delete')}
                    </button>
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-600">
                    {p.sku}
                  </td>
                  <td className="border-b border-slate-100 px-2 py-1">
                    <TextInput
                      value={p.nameAr}
                      placeholder={t('col.name')}
                      className="min-w-32 px-2 py-1 text-xs"
                      onChange={(e) => onEditField(p.sourceIndex, F.name, e.target.value)}
                    />
                  </td>
                  <td className="border-b border-slate-100 px-2 py-1">
                    <TextInput
                      value={p.price}
                      inputMode="decimal"
                      placeholder={t('col.price')}
                      className="min-w-24 px-2 py-1 text-xs"
                      onChange={(e) => onEditField(p.sourceIndex, F.price, e.target.value)}
                    />
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-600">
                    {(p.weight || '1') + ' ' + (p.weightUnit || 'kg')}
                  </td>
                  <td className="border-b border-slate-100 px-2 py-1">
                    <Select
                      value={cat}
                      className="min-w-32 px-2 py-1 text-xs"
                      onChange={(e) => onEditField(p.sourceIndex, F.category, e.target.value)}
                    >
                      <option value="">{t('preview.catNone')}</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      {extraCat && (
                        <option value={extraCat}>{t('preview.catNotListed', { name: extraCat })}</option>
                      )}
                    </Select>
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2">
                    <span className={opts.length ? 'font-semibold text-indigo-600' : 'text-slate-400'}>
                      {opts.length ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td
                    className="max-w-64 truncate border-b border-slate-100 px-3 py-2 text-slate-500"
                    title={opts.map((o) => `${o.nameAr}: ${o.values.join(', ')}`).join(' · ')}
                  >
                    {opts.map((o) => `${o.nameAr}: ${o.values.join(', ')}`).join(' · ')}
                  </td>
                  <td
                    className="max-w-48 truncate border-b border-slate-100 px-3 py-2 text-slate-500"
                    title={p.images.join(', ')}
                  >
                    {p.images.length ? (
                      <span className="text-slate-600">
                        {p.images.length > 1 ? `${p.images.length} 🖼️ · ` : ''}
                        {p.images[0]}
                      </span>
                    ) : (
                      <span className="text-amber-500">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {products.length > COLLAPSED_ROWS && (
        <div className="mt-3">
          <Button variant="ghost" onClick={() => setShowAll((s) => !s)}>
            {showAll ? t('preview.showLess') : t('preview.showAll', { n: products.length })}
          </Button>
        </div>
      )}
    </div>
  )
}
