import { useI18n } from '../lib/i18n'

/**
 * Memphis stepper. `current` is 1-based.
 *
 * Direction: chips render in logical order (1 → 2 → 3) inside a flex row, so
 * the inline-start edge holds step 1 — which is the RIGHT side under
 * dir="rtl" and the LEFT under dir="ltr". No physical left/right, no manual
 * reversing: the document direction does the flip, and the connector bars sit
 * between chips in reading order automatically.
 */
export default function Stepper({ current }: { current: 1 | 2 | 3 }) {
  const { t } = useI18n()
  const steps = [t('step.upload'), t('step.map'), t('step.export')]

  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-3">
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current

        // Chip fill/text by state (ink on teal for AA; white only on violet).
        const chip = done
          ? 'bg-[color:var(--teal)] text-[color:var(--on-teal)]'
          : active
            ? 'bg-[color:var(--violet)] text-[color:var(--on-violet)]'
            : 'bg-white text-[color:var(--ink)]'

        const badge = done
          ? 'bg-[color:var(--white)] text-[color:var(--ink)]'
          : active
            ? 'bg-[color:var(--white)] text-[color:var(--violet)]'
            : 'bg-[color:var(--cream)] text-[color:var(--ink)]'

        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            <div className={`hard-3 flex items-center gap-2 px-3 py-1.5 ${chip}`} style={{ borderRadius: 'var(--r-pill)' }}>
              <span
                className={`flex h-6 w-6 items-center justify-center border-2 border-[color:var(--ink)] text-[13px] font-extrabold ${badge}`}
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

            {n < steps.length && (
              <span aria-hidden className="hidden h-1 w-6 bg-[color:var(--ink)] sm:block sm:w-8" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
