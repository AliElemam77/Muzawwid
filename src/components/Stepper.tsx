import { Check } from 'lucide-react'
import { useI18n } from '../lib/i18n'

/**
 * Modern editorial stepper. `current` is 1-based.
 * Supports interactive navigation when `onStepClick` is provided.
 *
 * Colours come from the `.step-chip` system in tokens.css, shared with the
 * Map sub-stepper, so the two rows of steps on screen always match.
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

        const content = (
          <div
            className={`step-chip text-xs ${
              active ? 'step-chip--current' : done ? 'step-chip--done' : ''
            } ${isClickable ? 'step-chip--clickable' : ''}`}
          >
            <span className="step-badge">
              {done ? <Check className="size-3 stroke-[3]" /> : n}
            </span>
            <span style={{ fontFamily: 'var(--font-display)' }}>{label}</span>
          </div>
        )

        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            {isClickable ? (
              <button
                type="button"
                onClick={() => onStepClick(n)}
                className="appearance-none p-0 border-0 bg-transparent text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--coral-accent)] rounded-full"
                aria-current={active ? 'step' : undefined}
                title={label}
              >
                {content}
              </button>
            ) : (
              content
            )}

            {n < steps.length && (
              <span aria-hidden className={`step-line ${done ? 'step-line--done' : ''}`} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
