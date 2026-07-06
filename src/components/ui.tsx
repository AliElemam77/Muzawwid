import type {
  ReactNode,
  SelectHTMLAttributes,
  InputHTMLAttributes,
  ButtonHTMLAttributes,
} from 'react'

/** Shared Tailwind primitives so the mapping controls stay consistent + readable. */

const controlBase =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ' +
  'shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 ' +
  'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400'

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', ...rest } = props
  return <select className={`${controlBase} ${className}`} {...rest} />
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props
  return <input className={`${controlBase} ${className}`} {...rest} />
}

export function Card({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </header>
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
  variant?: 'primary' | 'ghost' | 'danger'
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500',
    ghost: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  }[variant]
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed ${styles} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-1 block text-sm font-medium text-slate-700">{children}</span>
}
