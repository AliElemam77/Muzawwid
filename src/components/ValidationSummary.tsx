import type { Validation } from '../lib/build'

/** Show export-blocking errors and non-blocking warnings with per-issue counts. */
export default function ValidationSummary({ validation }: { validation: Validation }) {
  const { errors, warnings, ok } = validation

  if (ok && warnings.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
        ✓ الملف جاهز للتصدير — لا توجد مشاكل.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="mb-2 text-sm font-bold text-red-800">
            أخطاء تمنع التصدير ({errors.length})
          </p>
          <ul className="space-y-2 text-sm text-red-700">
            {errors.map((e, i) => (
              <li key={i}>
                <div className="flex items-center justify-between gap-4">
                  <span>• {e.message}</span>
                  <span className="rounded bg-red-100 px-2 py-0.5 font-mono text-xs">
                    {e.count}
                  </span>
                </div>
                {e.examples && e.examples.length > 0 && (
                  <p className="mt-0.5 pr-3 text-xs text-red-500">
                    {e.examples.join('، ')}
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
            تنبيهات (لا تمنع التصدير) ({warnings.length})
          </p>
          <ul className="space-y-2 text-sm text-amber-700">
            {warnings.map((w, i) => (
              <li key={i}>
                <div className="flex items-center justify-between gap-4">
                  <span>• {w.message}</span>
                  <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-xs">
                    {w.count}
                  </span>
                </div>
                {w.examples && w.examples.length > 0 && (
                  <p className="mt-0.5 pr-3 text-xs text-amber-600">
                    {w.examples.join('، ')}
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
