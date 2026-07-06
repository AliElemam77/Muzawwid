import type { Validation, Issue } from '../lib/build'
import { useI18n, type TranslateFn } from '../lib/i18n'

/** Translate an issue by its stable code, falling back to the Arabic message. */
function issueText(t: TranslateFn, issue: Issue): string {
  const translated = t(`val.${issue.code}`)
  return translated === `val.${issue.code}` ? issue.message : translated
}

/** Show export-blocking errors and non-blocking warnings with per-issue counts. */
export default function ValidationSummary({ validation }: { validation: Validation }) {
  const { t } = useI18n()
  const { errors, warnings, ok } = validation

  if (ok && warnings.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
        {t('validate.ready')}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="mb-2 text-sm font-bold text-red-800">
            {t('validate.errorsTitle', { n: errors.length })}
          </p>
          <ul className="space-y-2 text-sm text-red-700">
            {errors.map((e, i) => (
              <li key={i}>
                <div className="flex items-center justify-between gap-4">
                  <span>• {issueText(t, e)}</span>
                  <span className="rounded bg-red-100 px-2 py-0.5 font-mono text-xs">
                    {e.count}
                  </span>
                </div>
                {e.examples && e.examples.length > 0 && (
                  <p className="mt-0.5 px-3 text-xs text-red-500">
                    {e.examples.join(' · ')}
                    {e.count > e.examples.length && ` … (+${e.count - e.examples.length})`}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 text-sm font-bold text-amber-800">
            {t('validate.warningsTitle', { n: warnings.length })}
          </p>
          <ul className="space-y-2 text-sm text-amber-700">
            {warnings.map((w, i) => (
              <li key={i}>
                <div className="flex items-center justify-between gap-4">
                  <span>• {issueText(t, w)}</span>
                  <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-xs">
                    {w.count}
                  </span>
                </div>
                {w.examples && w.examples.length > 0 && (
                  <p className="mt-0.5 px-3 text-xs text-amber-600">
                    {w.examples.join(' · ')}
                    {w.count > w.examples.length && ` … (+${w.count - w.examples.length})`}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
