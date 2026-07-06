import { useI18n } from '../lib/i18n'

/** Visual 3-step progress indicator. `current` is 1-based. */
export default function Stepper({ current }: { current: 1 | 2 | 3 }) {
  const { t } = useI18n()
  const steps = [t('step.upload'), t('step.map'), t('step.export')]
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span
                className={
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ' +
                  (active
                    ? 'bg-indigo-600 text-white'
                    : done
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-200 text-slate-500')
                }
              >
                {done ? '✓' : n}
              </span>
              <span
                className={
                  'text-sm font-semibold ' +
                  (active ? 'text-slate-900' : 'text-slate-400')
                }
              >
                {label}
              </span>
            </div>
            {n < steps.length && (
              <span className="hidden h-px w-8 bg-slate-300 sm:block" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
