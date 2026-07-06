import { useState } from 'react'
import { splitCategoryInput, normalizeCategories } from '../lib/categories'
import { useI18n } from '../lib/i18n'
import { TextInput, Button } from './ui'

/**
 * Manage the store's category list (persisted by the parent). Users define
 * their categories once, then pick from them per product in the preview.
 */
export default function CategoriesManager({
  categories,
  onChange,
}: {
  categories: string[]
  onChange: (next: string[]) => void
}) {
  const { t } = useI18n()
  const [draft, setDraft] = useState('')

  function addFromDraft() {
    const added = splitCategoryInput(draft)
    if (added.length) onChange(normalizeCategories([...categories, ...added]))
    setDraft('')
  }

  function remove(name: string) {
    onChange(categories.filter((c) => c !== name))
  }

  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">{t('categories.note')}</p>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextInput
            value={draft}
            placeholder={t('categories.placeholder')}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addFromDraft()
              }
            }}
          />
        </div>
        <Button onClick={addFromDraft} disabled={!draft.trim()}>
          {t('btn.add')}
        </Button>
      </div>

      {categories.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm text-indigo-800"
            >
              {c}
              <button
                onClick={() => remove(c)}
                title={t('categories.removeTitle')}
                className="text-indigo-400 transition hover:text-red-600"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-400">{t('categories.empty')}</p>
      )}
    </div>
  )
}
