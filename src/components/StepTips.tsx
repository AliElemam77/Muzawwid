import { useI18n } from '../lib/i18n'

/**
 * Guidance that stays out of the way.
 *
 * These used to sit open on every screen — a yellow block of three bullets
 * above each section, so the settings you actually came for started halfway
 * down the page. They are collapsed now: one quiet line you open only when
 * you want it.
 */
export default function StepTips({ tips }: { tips: string[] }) {
  const { t } = useI18n()
  if (tips.length === 0) return null

  return (
    <details className="group">
      <summary
        className="inline-flex cursor-pointer list-none items-center gap-1.5 font-bold text-[color:var(--ink)]/55 transition hover:text-[color:var(--ink)]"
        style={{ fontSize: 'var(--fs-label)' }}
      >
        <span aria-hidden>💡</span>
        {t('tips.toggle')}
        <span aria-hidden className="transition group-open:rotate-90">
          ›
        </span>
      </summary>
      <ul
        className="mt-2 space-y-1 border-s-2 border-[color:var(--ink)]/20 ps-3 text-[color:var(--ink)]/70"
        style={{ fontSize: 'var(--fs-label)' }}
      >
        {tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </details>
  )
}
