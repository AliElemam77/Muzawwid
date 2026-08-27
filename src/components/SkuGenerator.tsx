import type { SkuConfig } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { Select, TextInput } from './ui'

const MODE_KEYS: { mode: SkuConfig['mode']; key: string; icon: string }[] = [
  { mode: 'column', key: 'sku.column', icon: '📋' },
  { mode: 'auto', key: 'sku.auto', icon: '🔢' },
  { mode: 'regex', key: 'sku.regex', icon: '🔗' },
  { mode: 'none', key: 'sku.none', icon: '🚫' },
]

/** Configure how رمز المنتج sku is produced with live preview and clean segmented buttons. */
export default function SkuGenerator({
  columns,
  sku,
  onChange,
}: {
  columns: string[]
  sku: SkuConfig
  onChange: (next: SkuConfig) => void
}) {
  const { t } = useI18n()

  function pickMode(mode: SkuConfig['mode']) {
    switch (mode) {
      case 'none':
        return onChange({ mode: 'none' })
      case 'column':
        return onChange({ mode: 'column', column: columns[0] ?? '' })
      case 'regex':
        return onChange({ mode: 'regex', column: columns[0] ?? '', prefix: 'SKU-' })
      case 'auto':
        return onChange({ mode: 'auto', prefix: 'SKU-' })
    }
  }

  // Generate a live sample SKU for demonstration
  const sampleSku =
    sku.mode === 'auto'
      ? `${sku.prefix || 'SKU-'}1`
      : sku.mode === 'regex'
        ? `${sku.prefix || 'SKU-'}84920`
        : sku.mode === 'column'
          ? 'PROD-001'
          : null

  return (
    <div className="space-y-4">
      {/* Mode selection buttons */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {MODE_KEYS.map(({ mode, key, icon }) => {
          const active = sku.mode === mode
          return (
            <button
              key={mode}
              type="button"
              onClick={() => pickMode(mode)}
              className={`hard-2 lift flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-black transition ${
                active
                  ? 'bg-[color:var(--violet)] text-[color:var(--on-violet)]'
                  : 'bg-white text-[color:var(--ink)] hover:bg-[color:var(--cream)]'
              }`}
            >
              <span>{icon}</span>
              <span>{t(key)}</span>
            </button>
          )
        })}
      </div>

      {/* Mode Details Form */}
      <div className="hard-2 rounded-xl bg-white p-4">
        {sku.mode === 'column' && (
          <div className="max-w-md space-y-2">
            <label className="block text-xs font-bold text-[color:var(--ink)]">
              {t('sku.colLabel')}
            </label>
            <Select
              value={sku.column}
              onChange={(e) => onChange({ mode: 'column', column: e.target.value })}
            >
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        )}

        {sku.mode === 'auto' && (
          <div className="max-w-md space-y-2">
            <label className="block text-xs font-bold text-[color:var(--ink)]">
              {t('sku.prefix')}
            </label>
            <TextInput
              value={sku.prefix}
              placeholder={t('sku.prefixExampleSku')}
              onChange={(e) => onChange({ mode: 'auto', prefix: e.target.value })}
            />
            <p className="text-xs font-medium text-[color:var(--ink)]/65">{t('sku.autoHint')}</p>
          </div>
        )}

        {sku.mode === 'regex' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[color:var(--ink)]">
                {t('sku.urlColLabel')}
              </label>
              <Select
                value={sku.column}
                onChange={(e) => onChange({ ...sku, column: e.target.value })}
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[color:var(--ink)]">
                {t('sku.prefix')}
              </label>
              <TextInput
                value={sku.prefix}
                placeholder={t('sku.prefixExampleSelia')}
                onChange={(e) => onChange({ ...sku, prefix: e.target.value })}
              />
            </div>
            <p className="text-xs font-medium text-[color:var(--ink)]/65 sm:col-span-2">
              {t('sku.regexHint')}
            </p>
          </div>
        )}

        {sku.mode === 'none' && (
          <p className="text-xs font-medium text-[color:var(--ink)]/60">
            لن يتم توليد أو تصدير رمز SKU للمنتجات (سيُترك العمود فارغًا).
          </p>
        )}

        {/* Live SKU Sample Box */}
        {sampleSku && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-[color:var(--cream)]/60 p-3 text-xs border border-[color:var(--ink)]/15">
            <span className="font-bold text-[color:var(--ink)]/70">معاينة الرمز المولد:</span>
            <span className="rounded-md bg-white px-2.5 py-1 font-mono font-black text-[color:var(--ink)] border border-[color:var(--ink)]/20 shadow-xs">
              منتج: {sampleSku}
            </span>
            <span className="rounded-md bg-white px-2.5 py-1 font-mono font-black text-[color:var(--ink)] border border-[color:var(--ink)]/20 shadow-xs">
              خيار: {sampleSku}-M
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
