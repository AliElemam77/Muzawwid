import { useEffect, useId, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '../lib/i18n'

/**
 * A focused, dismissible surface for inspecting a large preview without keeping
 * it on the page.
 *
 * Deliberately plain: one flat panel, a hairline, and a round close button.
 * No header bar in a second colour, no offset shadow, no border stack — the
 * content is the thing being looked at, so the chrome stays out of its way.
 */
export default function Modal({
  title,
  onClose,
  children,
  size = 'lg',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  /** `lg` for wide data previews, `md` for an embedded tool, `sm` for a question. */
  size?: 'sm' | 'md' | 'lg'
}) {
  const { t } = useI18n()
  const titleId = useId()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // The page behind must not scroll while a full-height panel is open.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`modal-panel flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden ${
          // `lg` matches the page container (80rem) so the preview lines up with the app.
          size === 'sm' ? 'max-w-[34rem]' : size === 'md' ? 'max-w-[52rem]' : 'max-w-[80rem]'
        }`}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/8 px-6 py-4">
          <h2
            id={titleId}
            className="truncate font-black text-[color:var(--ink)]"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-body)' }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('btn.close')}
            title={t('btn.close')}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#A3A3A3] transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="scroll-thin overflow-auto px-6 py-5">{children}</div>
      </section>
    </div>
  )
}
