import { useRef, useState } from 'react'
import type { SourceSheet } from '../lib/reader'
import type { MappingConfig } from '../lib/types'
import {
  renderTemplate,
  templateVars,
  tokenFor,
  EMPTY_TEMPLATE,
  type TemplateConfig,
} from '../lib/template'
import {
  TEMPLATE_STARTERS,
  loadTemplates,
  saveTemplate,
  deleteTemplate,
  starterConfig,
  type SavedTemplate,
} from '../lib/templatePresets'
import { useI18n } from '../lib/i18n'
import { TextInput, Button } from './ui'
import RichTextEditor from './RichTextEditor'

/**
 * Build الوصف for EVERY product from one HTML skeleton with `{{placeholders}}`.
 *
 * The whole section is behind a switch and off by default: it rewrites a field
 * the user may already have mapped, so it never acts until asked. When it is
 * off nothing below it renders — an inert editor is just noise.
 *
 * The preview renders against the first row of the actual sheet, because a
 * template only makes sense once you see it filled with real data.
 */
export default function DescriptionTemplateEditor({
  sheet,
  config,
  onChange,
}: {
  sheet: SourceSheet
  config: MappingConfig
  onChange: (next: TemplateConfig) => void
}) {
  const { t } = useI18n()
  const tpl = config.descriptionTemplate ?? EMPTY_TEMPLATE
  const [saved, setSaved] = useState<SavedTemplate[]>(() => loadTemplates())
  const [saveName, setSaveName] = useState('')
  /** Caret position inside the editor, so an inserted variable lands there. */
  const savedRange = useRef<Range | null>(null)

  // Mapped Salla fields first (processed values), then every sheet column.
  const mapped = Object.entries(config.fields)
    .filter(([, src]) => src && src.kind !== 'none')
    .map(([header]) => header)
  const vars = templateVars(mapped, sheet.headers)

  const sampleRow = sheet.rows.find((r) => Object.values(r).some(Boolean)) ?? {}
  const preview = renderTemplate(tpl.html, sampleRow)

  function setHtml(html: string) {
    onChange({ ...tpl, html })
  }

  function rememberCaret() {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange()
  }

  /** Drop `{{name}}` at the caret, or append it when the editor was never focused. */
  function insertVar(name: string) {
    const token = tokenFor(name)
    const range = savedRange.current
    if (!range) {
      setHtml(tpl.html + token)
      return
    }
    const sel = window.getSelection()
    if (!sel) return
    sel.removeAllRanges()
    sel.addRange(range)
    range.deleteContents()
    range.insertNode(document.createTextNode(token))
    sel.collapseToEnd()
    // Read the DOM back rather than splicing strings — the browser just told us
    // exactly what the document is now.
    const host = range.startContainer.parentElement?.closest('.tpl-editor')
    if (host) setHtml(host.innerHTML)
  }

  function applySaved(name: string) {
    const found = saved.find((s) => s.name === name)
    if (found) onChange({ enabled: true, html: found.html })
  }

  return (
    <div className="space-y-4">
      {/* --- The switch. Everything below it is conditional on it. ----------- */}
      <label
        className="flex cursor-pointer items-start gap-3 border-2 border-[color:var(--ink)] bg-white p-3"
        style={{ borderRadius: 'var(--r-input)' }}
      >
        <input
          type="checkbox"
          checked={tpl.enabled}
          onChange={(e) =>
            onChange(e.target.checked ? (tpl.html ? { ...tpl, enabled: true } : starterConfig()) : { ...tpl, enabled: false })
          }
          className="mt-1 size-5 shrink-0"
        />
        <span>
          <span className="block font-bold text-[color:var(--ink)]">
            {t('tpl.switchLabel')}
          </span>
          <span
            className="mt-0.5 block text-[color:var(--ink)]/60"
            style={{ fontSize: 'var(--fs-label)' }}
          >
            {t('tpl.switchNote')}
          </span>
        </span>
      </label>

      {/* Switched off, the section would otherwise be a lone checkbox and read
          as broken. Show what turning it on gives, and a way to do it. */}
      {!tpl.enabled && (
        <div
          className="border-2 border-dashed border-[color:var(--ink)]/25 p-6 text-center"
          style={{ borderRadius: 'var(--r-input)' }}
        >
          <p
            className="mx-auto max-w-md text-[color:var(--ink)]/60"
            style={{ fontSize: 'var(--fs-label)' }}
          >
            {t('tpl.offHint')}
          </p>
          <div
            className="tpl-editor mx-auto mt-4 max-w-md border border-[color:var(--ink)]/15 bg-[color:var(--cream)] p-3 text-start opacity-60"
            style={{ fontSize: 'var(--fs-label)', borderRadius: 'var(--r-input)' }}
            aria-hidden
          >
            <p>
              <strong>{'{{أسم المنتج}}'}</strong>
            </p>
            <ul>
              <li>{'الخامة: {{الخامة}}'}</li>
              <li>{'الماركة: {{الماركة}}'}</li>
            </ul>
          </div>
          <div className="mt-4">
            <Button onClick={() => onChange(tpl.html ? { ...tpl, enabled: true } : starterConfig())}>
              {t('tpl.offCta')}
            </Button>
          </div>
        </div>
      )}

      {tpl.enabled && (
        <>
          {/* --- Ready-made starting points ------------------------------- */}
          <div>
            <p
              className="mb-2 font-bold text-[color:var(--ink)]/70"
              style={{ fontSize: 'var(--fs-label)' }}
            >
              {t('tpl.startersLabel')}
            </p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_STARTERS.map((s) => (
                <Button key={s.labelKey} variant="ghost" onClick={() => setHtml(s.html)}>
                  {t(s.labelKey)}
                </Button>
              ))}
            </div>
          </div>

          {/* --- Variable inserter ----------------------------------------- */}
          <div>
            <p
              className="mb-2 font-bold text-[color:var(--ink)]/70"
              style={{ fontSize: 'var(--fs-label)' }}
            >
              {t('tpl.varsLabel')}
            </p>
            <div className="scroll-thin flex max-h-32 flex-wrap gap-1.5 overflow-y-auto p-1">
              {vars.map((v) => (
                <button
                  key={v.name}
                  type="button"
                  title={t(v.source === 'field' ? 'tpl.varField' : 'tpl.varColumn')}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertVar(v.name)}
                  className={`hard-2 lift flex items-center gap-1 px-2.5 py-1 text-xs font-bold transition ${
                    v.source === 'field'
                      ? 'bg-[color:var(--teal)]/20 text-[color:var(--ink)]'
                      : 'bg-white text-[color:var(--ink)] hover:bg-[color:var(--cream)]'
                  }`}
                  style={{ borderRadius: 'var(--r-pill)' }}
                >
                  <span className="text-[10px] text-[color:var(--ink)]/50">+</span>
                  <span>{v.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* --- The editor ------------------------------------------------ */}
          <RichTextEditor value={tpl.html} onChange={setHtml} onCaretSave={rememberCaret} />

          {/* --- Live preview against the first real row -------------------- */}
          <div>
            <p
              className="mb-2 font-bold text-[color:var(--ink)]/70"
              style={{ fontSize: 'var(--fs-label)' }}
            >
              {t('tpl.previewLabel')}
            </p>
            <div
              className="border border-[color:var(--ink)]/20 bg-[color:var(--cream)] p-3"
              style={{ borderRadius: 'var(--r-input)' }}
            >
              {preview ? (
                // Safe: every value substituted in is HTML-escaped by
                // renderTemplate; the markup is the user's own template.
                <div
                  className="tpl-editor"
                  style={{ fontSize: 'var(--fs-body)' }}
                  dangerouslySetInnerHTML={{ __html: preview }}
                />
              ) : (
                <p className="text-[color:var(--ink)]/50" style={{ fontSize: 'var(--fs-label)' }}>
                  {t('tpl.previewEmpty')}
                </p>
              )}
            </div>
          </div>

          {/* --- Save / reuse ---------------------------------------------- */}
          <div className="space-y-2 border-t border-[color:var(--ink)]/15 pt-4">
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-48 flex-1">
                <TextInput
                  value={saveName}
                  placeholder={t('tpl.savePlaceholder')}
                  onChange={(e) => setSaveName(e.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                disabled={!saveName.trim() || !tpl.html.trim()}
                onClick={() => {
                  setSaved(saveTemplate(saveName, tpl.html))
                  setSaveName('')
                }}
              >
                {t('tpl.saveBtn')}
              </Button>
            </div>

            {saved.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {saved.map((s) => (
                  <span
                    key={s.name}
                    className="inline-flex items-center gap-2 border border-[color:var(--ink)]/25 px-3 py-1"
                    style={{ borderRadius: 'var(--r-pill)', fontSize: 'var(--fs-label)' }}
                  >
                    <button
                      type="button"
                      onClick={() => applySaved(s.name)}
                      className="font-bold"
                      title={t('tpl.applyTitle')}
                    >
                      {s.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaved(deleteTemplate(s.name))}
                      title={t('tpl.deleteTitle')}
                      className="text-[color:var(--ink)]/40 transition hover:text-red-600"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
