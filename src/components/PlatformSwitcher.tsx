import { PLATFORMS, type PlatformId } from '../lib/platforms'
import { useI18n } from '../lib/i18n'

/** Big segmented selector for the export target platform, with brand logos. */
export default function PlatformSwitcher({
  value,
  onChange,
}: {
  value: PlatformId
  onChange: (id: PlatformId) => void
}) {
  const { t } = useI18n()

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-600">{t('platform.choose')}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PLATFORMS.map((p) => {
          const selected = p.id === value
          return (
            <button
              key={p.id}
              onClick={() => onChange(p.id)}
              aria-pressed={selected}
              className={
                'group relative flex flex-col items-center gap-2 rounded-2xl border bg-white p-4 text-center transition ' +
                (selected
                  ? 'border-transparent shadow-md ring-2'
                  : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow')
              }
              style={selected ? { ['--tw-ring-color' as string]: p.color } : undefined}
            >
              <span
                className={
                  'absolute top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ' +
                  (p.ready
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500') +
                  ' inset-e-2'
                }
              >
                {p.ready ? t('platform.ready') : t('platform.soonBadge')}
              </span>

              <p.Logo size={40} />

              <span
                className="text-sm font-bold"
                style={{ color: selected ? p.color : '#334155' }}
              >
                {t(p.nameKey)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
