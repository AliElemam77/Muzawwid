import { useEffect, useRef } from 'react'
import { useI18n } from '../lib/i18n'

/**
 * A small contentEditable HTML editor — bold / italic / list / heading, and
 * nothing else. Salla's الوصف column accepts HTML, and the description template
 * is the one place in this app where a user writes formatted prose.
 *
 * Deliberately uncontrolled: writing `innerHTML` on every render would reset the
 * caret to the start on each keystroke. The DOM owns the text while the user is
 * typing, and we only push `value` in when it differs from what is already
 * there (a starter template being loaded, a saved one applied).
 *
 * `document.execCommand` is deprecated but is still the only zero-dependency
 * way to do this, and is implemented everywhere. The alternative is a rich-text
 * library, which this browser-only tool does not otherwise need.
 */
export default function RichTextEditor({
  value,
  onChange,
  onCaretSave,
  minHeight = '12rem',
}: {
  value: string
  onChange: (html: string) => void
  /** Called on blur/selection change so a parent can insert at the caret. */
  onCaretSave?: () => void
  minHeight?: string
}) {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el && value !== el.innerHTML) el.innerHTML = value
  }, [value])

  function exec(command: string, arg?: string) {
    ref.current?.focus()
    document.execCommand(command, false, arg)
    if (ref.current) onChange(ref.current.innerHTML)
  }

  const tools: { label: string; titleKey: string; run: () => void; bold?: boolean }[] = [
    { label: 'B', titleKey: 'rte.bold', run: () => exec('bold'), bold: true },
    { label: 'I', titleKey: 'rte.italic', run: () => exec('italic') },
    { label: '•≡', titleKey: 'rte.ul', run: () => exec('insertUnorderedList') },
    { label: '1≡', titleKey: 'rte.ol', run: () => exec('insertOrderedList') },
    { label: 'H', titleKey: 'rte.heading', run: () => exec('formatBlock', '<h3>') },
    { label: '¶', titleKey: 'rte.paragraph', run: () => exec('formatBlock', '<p>') },
    { label: '⌫', titleKey: 'rte.clear', run: () => exec('removeFormat') },
  ]

  return (
    <div
      className="overflow-hidden border-2 border-[color:var(--ink)] bg-white"
      style={{ borderRadius: 'var(--r-input)' }}
    >
      <div className="flex flex-wrap items-center gap-1 border-b-2 border-[color:var(--ink)]/15 p-1.5">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={t(tool.titleKey)}
            // Keep the caret where it is — mousedown would blur the editor
            // first and execCommand would then have nothing selected.
            onMouseDown={(e) => e.preventDefault()}
            onClick={tool.run}
            className={
              'min-w-8 px-2 py-1 text-xs transition hover:bg-[color:var(--ink)]/8 ' +
              (tool.bold ? 'font-extrabold' : 'font-bold')
            }
            style={{ borderRadius: 'var(--r-input)' }}
          >
            {tool.label}
          </button>
        ))}
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        dir="rtl"
        role="textbox"
        aria-multiline="true"
        aria-label={t('tpl.editorLabel')}
        data-placeholder={t('tpl.editorPlaceholder')}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        onBlur={onCaretSave}
        onKeyUp={onCaretSave}
        onMouseUp={onCaretSave}
        className="tpl-editor overflow-y-auto p-3 outline-none"
        style={{ minHeight, maxHeight: '24rem', fontSize: 'var(--fs-body)' }}
      />
    </div>
  )
}
