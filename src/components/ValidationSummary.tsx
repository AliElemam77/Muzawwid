import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
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
      <div className="flex items-center gap-2.5 rounded-xl border border-[#12b3a4]/30 bg-[#12b3a4]/10 p-4 text-sm font-bold text-[#2FE0CF]">
        <CheckCircle2 className="size-5 shrink-0 text-[#12b3a4]" />
        <span>{t('validate.ready')}</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <div className="rounded-xl border border-[#FF6B50]/30 bg-[#FF6B50]/10 p-4">
          <div className="mb-2.5 flex items-center gap-2 text-sm font-black text-[#FF856E]">
            <AlertCircle className="size-4 shrink-0 text-[#FF6B50]" />
            <span>{t('validate.errorsTitle', { n: errors.length })}</span>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-[#FF856E]">
            {errors.map((e, i) => (
              <li key={i}>
                <div className="flex items-center justify-between gap-4">
                  <span>• {issueText(t, e)}</span>
                  <span className="rounded bg-[#FF6B50]/20 px-2 py-0.5 font-mono text-xs font-bold text-[#FF856E]">
                    {e.count}
                  </span>
                </div>
                {e.examples && e.examples.length > 0 && (
                  <p className="mt-0.5 px-3 text-xs text-[#FF856E]/80">
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
        <div className="rounded-xl border border-[#ffc531]/30 bg-[#ffc531]/10 p-4">
          <div className="mb-2.5 flex items-center gap-2 text-sm font-black text-[#ffd666]">
            <AlertTriangle className="size-4 shrink-0 text-[#ffc531]" />
            <span>{t('validate.warningsTitle', { n: warnings.length })}</span>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-[#ffd666]">
            {warnings.map((w, i) => (
              <li key={i}>
                <div className="flex items-center justify-between gap-4">
                  <span>• {issueText(t, w)}</span>
                  <span className="rounded bg-[#ffc531]/20 px-2 py-0.5 font-mono text-xs font-bold text-[#ffd666]">
                    {w.count}
                  </span>
                </div>
                {w.examples && w.examples.length > 0 && (
                  <p className="mt-0.5 px-3 text-xs text-[#ffd666]/80">
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
