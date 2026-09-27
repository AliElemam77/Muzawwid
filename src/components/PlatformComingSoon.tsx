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
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#111111] p-10 text-center shadow-lg">
      <platform.Logo size={64} />
      <span className="rounded-full border border-[#ffc531]/35 bg-[#ffc531]/15 px-3 py-1 text-xs font-bold text-[#ffd666]">
        {t('platform.soonBadge')}
      </span>
      <h3 className="text-lg font-black text-white">
        {t('platform.soonTitle', { name })}
      </h3>
      <p className="max-w-md text-sm text-[#D4D4D4]">
        {t('platform.soonBody', { name })}
      </p>
      <Button onClick={onBackToSalla}>{t('platform.switchToSalla')}</Button>
    </div>
  )
}
