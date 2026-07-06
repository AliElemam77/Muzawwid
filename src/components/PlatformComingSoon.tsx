import type { Platform } from '../lib/platforms'
import { useI18n } from '../lib/i18n'
import { Button } from './ui'

/** Tasteful placeholder shown when a not-yet-implemented platform is selected. */
export default function PlatformComingSoon({
  platform,
  onBackToSalla,
}: {
  platform: Platform
  onBackToSalla: () => void
}) {
  const { t } = useI18n()
  const name = t(platform.nameKey)

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <platform.Logo size={64} />
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
        {t('platform.soonBadge')}
      </span>
      <h3 className="text-lg font-bold text-slate-900">
        {t('platform.soonTitle', { name })}
      </h3>
      <p className="max-w-md text-sm text-slate-500">
        {t('platform.soonBody', { name })}
      </p>
      <Button onClick={onBackToSalla}>{t('platform.switchToSalla')}</Button>
    </div>
  )
}
