import type { PromoTitleConfig, PromoFallback } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { Select, Label } from './ui'

const FALLBACK_KEYS: { value: PromoFallback; key: string }[] = [
  { value: 'name', key: 'promo.fallback.name' },
  { value: 'description', key: 'promo.fallback.description' },
  { value: 'none', key: 'promo.fallback.none' },
]

/**
 * How العنوان الترويجي behaves: Salla rejects anything over 25 characters, so
 * the value is clamped, and an empty one is derived from the name/description.
 */
export default function PromoTitleEditor({
  promoTitle,
  onChange,
}: {
  promoTitle: PromoTitleConfig
  onChange: (next: PromoTitleConfig) => void
}) {
  const { t } = useI18n()

  return (
    <div className="rounded-xl border border-white/10 bg-[#161616] p-4">
      <p className="mb-3 text-xs text-[#A3A3A3]">{t('promo.note')}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>{t('promo.fallbackLabel')}</Label>
          <Select
            value={promoTitle.fallback}
            onChange={(e) => onChange({ ...promoTitle, fallback: e.target.value as PromoFallback })}
          >
            {FALLBACK_KEYS.map((f) => (
              <option key={f.value} value={f.value}>
                {t(f.key)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t('promo.truncateLabel')}</Label>
          <label className="flex cursor-pointer items-center gap-2 py-2 text-xs text-[#D4D4D4]">
            <input
              type="checkbox"
              className="accent-[#FF6B50]"
              checked={promoTitle.truncate}
              onChange={(e) => onChange({ ...promoTitle, truncate: e.target.checked })}
            />
            {t('promo.truncateHint')}
          </label>
        </div>
      </div>
    </div>
  )
}
