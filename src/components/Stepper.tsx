import { useI18n } from '../lib/i18n'

/**
 * Memphis stepper. `current` is 1-based.
 * Supports interactive navigation when `onStepClick` is provided.
 */
export default function Stepper({
  current,
  canNavigate = true,
  onStepClick,
}: {
  current: 1 | 2 | 3
  canNavigate?: boolean
  onStepClick?: (step: 1 | 2 | 3) => void
}) {
  const { t } = useI18n()
  const steps = [t('step.upload'), t('step.map'), t('step.export')]

  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-3">
      {steps.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3
        const done = n < current
        const active = n === current
        const isClickable = canNavigate && onStepClick != null && (done || active)

        // Chip fill/text by state (ink on teal for AA; white only on violet).
        const chip = done
          ? 'bg-[color:var(--teal)] text-[color:var(--on-teal)]'
          : active
            ? 'bg-[color:var(--violet)] text-[color:var(--on-violet)]'
            : 'bg-white text-[color:var(--ink)] opacity-75'

        const badge = done
          ? 'bg-[color:var(--white)] text-[color:var(--ink)]'
          : active
            ? 'bg-[color:var(--white)] text-[color:var(--violet)]'
            : 'bg-[color:var(--cream)] text-[color:var(--ink)]'

        const content = (
          <div
            className={`hard-3 flex items-center gap-2 px-3.5 py-1.5 transition-transform ${
              isClickable ? 'lift cursor-pointer hover:scale-102' : ''
            } ${chip}`}
            style={{ borderRadius: 'var(--r-pill)' }}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center border-2 border-[color:var(--ink)] text-[13px] font-extrabold shadow-xs ${badge}`}
              style={{ borderRadius: 'var(--r-pill)' }}
            >
              {done ? '✓' : n}
            </span>
            <span
              className="font-bold whitespace-nowrap"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-label)' }}
            >
              {label}
            </span>
          </div>
        )

        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            {isClickable ? (
              <button
                type="button"
                onClick={() => onStepClick(n)}
                className="appearance-none p-0 border-0 bg-transparent text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--violet)] rounded-full"
                aria-current={active ? 'step' : undefined}
                title={label}
              >
                {content}
              </button>
            ) : (
              content
            )}

            {n < steps.length && (
              <span
                aria-hidden
                className={`hidden h-1 w-6 sm:block sm:w-8 transition-colors ${
                  done ? 'bg-[color:var(--teal)]' : 'bg-[color:var(--ink)]/30'
                }`}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
