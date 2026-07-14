import type {
  ReactNode,
  SelectHTMLAttributes,
  InputHTMLAttributes,
  ButtonHTMLAttributes,
} from 'react'

/** Shared Memphis / neo-brutalist primitives. All visual tokens live in
 *  src/styles/tokens.css — these components only compose token classes.
 *  Nothing here carries inline hex, and RTL shadow-flipping is handled
 *  centrally by --sh-dir, so callers never think about direction. */

const controlBase =
  'w-full bg-white px-3 py-2 text-[color:var(--ink)] outline-none ' +
  'hard-2 disabled:cursor-not-allowed disabled:bg-[color:var(--dead)] ' +
  'disabled:text-[color:var(--dead-ink)] disabled:border-transparent disabled:shadow-none'

const controlStyle = { borderRadius: 'var(--r-input)', fontSize: 'var(--fs-body)' }

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', style, ...rest } = props
  return (
    <select className={`${controlBase} ${className}`} style={{ ...controlStyle, ...style }} {...rest} />
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', style, ...rest } = props
  return (
    <input className={`${controlBase} ${className}`} style={{ ...controlStyle, ...style }} {...rest} />
  )
}

export function Card({
  title,
  subtitle,
  children,
  className = '',
}: {
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`card p-5 ${className}`}>
      {(title || subtitle) && (
        <header className="mb-4">
          {title && (
            <h2
              className="font-extrabold text-[color:var(--ink)]"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-section)' }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-1 text-[color:var(--ink)]/70" style={{ fontSize: 'var(--fs-label)' }}>
              {subtitle}
            </p>
          )}
        </header>
      )}
      {children}
    </section>
  )
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`btn btn--${variant} ${className}`} {...rest}>
      {children}
    </button>
  )
}

/** Small outlined status/label chip. `solid` adds the hard offset shadow. */
export function Pill({
  children,
  tone = 'plain',
  solid = false,
  className = '',
}: {
  children: ReactNode
  tone?: 'plain' | 'teal' | 'violet' | 'mustard' | 'coral'
  solid?: boolean
  className?: string
}) {
  const toneClass = tone === 'plain' ? '' : `pill--${tone}`
  return (
    <span className={`pill ${toneClass} ${solid ? 'pill--solid' : ''} ${className}`}>{children}</span>
  )
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <span
      className="mb-1 block font-bold text-[color:var(--ink)]"
      style={{ fontSize: 'var(--fs-label)' }}
    >
      {children}
    </span>
  )
}
