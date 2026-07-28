import { useState } from 'react'
import {
  buildCategoryTree,
  addCategoryPath,
  removeCategoryPath,
  type CategoryNode,
} from '../lib/categories'
import { useI18n } from '../lib/i18n'
import { TextInput, Button } from './ui'

/**
 * Manage the store's category list (persisted by the parent) as a TREE: a main
 * category can hold sub-categories, nested as deep as the store needs. The list
 * itself stays flat — one full path per entry (`ملابس > رجالي`) — so the user
 * never types the `>` separator; the UI composes it from where they clicked.
 * Users define categories once here, then pick from them per product.
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
  /** Path whose "add sub-category" input is open ('' = none). */
  const [addingUnder, setAddingUnder] = useState<string | null>(null)
  const [subDraft, setSubDraft] = useState('')

  const tree = buildCategoryTree(categories)

  function addTopLevel() {
    if (!draft.trim()) return
    onChange(addCategoryPath(categories, '', draft))
    setDraft('')
  }

  function addSub(parentPath: string) {
    if (!subDraft.trim()) return
    onChange(addCategoryPath(categories, parentPath, subDraft))
    setSubDraft('')
    setAddingUnder(null)
  }

  function openSub(path: string) {
    setAddingUnder((cur) => (cur === path ? null : path))
    setSubDraft('')
  }

  function renderNode(node: CategoryNode) {
    const isAdding = addingUnder === node.path
    return (
      <li key={node.path}>
        <div
          className="flex items-center gap-2 py-1"
          // Indent by depth. Logical padding so RTL and LTR both nest inward.
          style={{ paddingInlineStart: `${node.depth * 1.25}rem` }}
        >
          {node.depth > 0 && (
            <span aria-hidden className="text-[color:var(--ink)]/30">
              ↳
            </span>
          )}
          <span
            className={
              'rounded-full border border-[color:var(--ink)]/20 px-3 py-1 ' +
              (node.depth === 0 ? 'font-bold' : 'text-[color:var(--ink)]/80')
            }
            style={{ fontSize: 'var(--fs-label)' }}
          >
            {node.label}
          </span>
          <button
            onClick={() => openSub(node.path)}
            title={t('categories.addSubTitle', { name: node.label })}
            className="rounded-md border border-[color:var(--ink)]/20 px-2 py-1 text-xs font-bold transition hover:bg-[color:var(--ink)]/5"
          >
            {t('categories.addSub')}
          </button>
          <button
            onClick={() => onChange(removeCategoryPath(categories, node.path))}
            title={
              node.children.length
                ? t('categories.removeWithSubs', { n: node.children.length })
                : t('categories.removeTitle')
            }
            className="text-[color:var(--ink)]/40 transition hover:text-red-600"
          >
            ✕
          </button>
        </div>

        {isAdding && (
          <div
            className="flex items-end gap-2 py-1"
            style={{ paddingInlineStart: `${(node.depth + 1) * 1.25}rem` }}
          >
            <div className="max-w-xs flex-1">
              <TextInput
                autoFocus
                value={subDraft}
                placeholder={t('categories.subPlaceholder', { parent: node.label })}
                className="px-2 py-1 text-xs"
                onChange={(e) => setSubDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSub(node.path)
                  }
                  if (e.key === 'Escape') setAddingUnder(null)
                }}
              />
            </div>
            <Button onClick={() => addSub(node.path)} disabled={!subDraft.trim()}>
              {t('btn.add')}
            </Button>
            <Button variant="ghost" onClick={() => setAddingUnder(null)}>
              {t('btn.cancel')}
            </Button>
          </div>
        )}

        {node.children.length > 0 && <ul>{node.children.map(renderNode)}</ul>}
      </li>
    )
  }

  return (
    <div>
      {/* Salla matches import rows to categories that ALREADY exist in the
          store — it does not create them. A category typed only here fails the
          import, so the warning has to be impossible to miss. */}
      <div className="mb-3 rounded-xl border-2 border-red-300 bg-red-50 p-4">
        <p className="text-sm font-extrabold text-red-700">
          ⚠️ {t('categories.storeWarnTitle')}
        </p>
        <p className="mt-1 text-sm font-bold text-red-600">{t('categories.storeWarnBody')}</p>
      </div>

      <p className="mb-3 text-[color:var(--ink)]/70" style={{ fontSize: 'var(--fs-label)' }}>
        {t('categories.note')}
      </p>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextInput
            value={draft}
            placeholder={t('categories.placeholder')}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTopLevel()
              }
            }}
          />
        </div>
        <Button onClick={addTopLevel} disabled={!draft.trim()}>
          {t('categories.addMain')}
        </Button>
      </div>

      {tree.length > 0 ? (
        <ul className="mt-4">{tree.map(renderNode)}</ul>
      ) : (
        <p className="mt-4 text-[color:var(--ink)]/50" style={{ fontSize: 'var(--fs-label)' }}>
          {t('categories.empty')}
        </p>
      )}
    </div>
  )
}
