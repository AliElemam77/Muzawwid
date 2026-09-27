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
      <p className="mb-2 text-sm font-semibold text-[#D4D4D4]">{t('platform.choose')}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PLATFORMS.map((p) => {
          const selected = p.id === value
          return (
            <button
              key={p.id}
              onClick={() => onChange(p.id)}
              aria-pressed={selected}
              className={
                'group relative flex flex-col items-center gap-2 rounded-2xl border bg-[#141414] p-4 text-center transition ' +
                (selected
                  ? 'border-transparent shadow-lg ring-2'
                  : 'border-white/10 hover:border-white/25 hover:bg-[#1A1A1A]')
              }
              style={selected ? { ['--tw-ring-color' as string]: p.color } : undefined}
            >
              <span
                className={
                  'absolute top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ' +
                  (p.ready
                    ? 'border border-[#12b3a4]/40 bg-[#12b3a4]/15 text-[#2FE0CF]'
                    : 'border border-white/12 bg-[#1F1F1F] text-[#A3A3A3]') +
                  ' inset-e-2'
                }
              >
                {p.ready ? t('platform.ready') : t('platform.soonBadge')}
              </span>

              <p.Logo size={40} />

              <span
                className="text-sm font-bold"
                style={{ color: selected ? p.color : '#EBEBEB' }}
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
