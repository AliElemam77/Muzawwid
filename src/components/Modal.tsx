import { useEffect, useId, type ReactNode } from 'react'

/** A focused, dismissible surface for inspecting a large preview without keeping it on the page. */
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
  const titleId = useId()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden bg-[color:var(--cream)] hard-3 ${
          // `lg` matches the page container (80rem) so the preview lines up with the app.
          size === 'sm' ? 'max-w-[34rem]' : size === 'md' ? 'max-w-[52rem]' : 'max-w-[80rem]'
        }`}
        style={{ borderRadius: 'var(--r-card)' }}
      >
        <header className="flex items-center justify-between gap-4 border-b-2 border-[color:var(--ink)] bg-white px-5 py-3">
          <h2 id={titleId} className="font-extrabold text-[color:var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="hard-2 lift bg-white px-3 py-1 font-bold text-[color:var(--ink)]"
            style={{ borderRadius: 'var(--r-pill)', fontSize: 'var(--fs-label)' }}
          >
            ×
          </button>
        </header>
        <div className="scroll-thin overflow-auto p-5">{children}</div>
      </section>
    </div>
  )
}
