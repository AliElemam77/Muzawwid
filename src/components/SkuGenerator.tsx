import { FileText, Binary, Link2, Ban } from 'lucide-react'
import type { SkuConfig } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { Select, TextInput } from './ui'

const MODE_KEYS: { mode: SkuConfig['mode']; key: string; icon: typeof FileText }[] = [
  { mode: 'column', key: 'sku.column', icon: FileText },
  { mode: 'auto', key: 'sku.auto', icon: Binary },
  { mode: 'regex', key: 'sku.regex', icon: Link2 },
  { mode: 'none', key: 'sku.none', icon: Ban },
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
        {MODE_KEYS.map(({ mode, key, icon: Icon }) => {
          const active = sku.mode === mode
          return (
            <button
              key={mode}
              type="button"
              onClick={() => pickMode(mode)}
              className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-black transition ${
                active
                  ? 'bg-[#FF6B50] text-[#050505] shadow-sm'
                  : 'bg-[#181818] border border-white/10 text-[#D4D4D4] hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span>{t(key)}</span>
            </button>
          )
        })}
      </div>

      {/* Mode Details Form */}
      <div className="rounded-xl bg-[#141414] border border-white/10 p-4">
        {sku.mode === 'column' && (
          <div className="max-w-md space-y-2">
            <label className="block text-xs font-bold text-white">
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
            <label className="block text-xs font-bold text-white">
              {t('sku.prefix')}
            </label>
            <TextInput
              value={sku.prefix}
              placeholder={t('sku.prefixExampleSku')}
              onChange={(e) => onChange({ mode: 'auto', prefix: e.target.value })}
            />
            <p className="text-xs font-medium text-[#A3A3A3]">{t('sku.autoHint')}</p>
          </div>
        )}

        {sku.mode === 'regex' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-white">
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
              <label className="block text-xs font-bold text-white">
                {t('sku.prefix')}
              </label>
              <TextInput
                value={sku.prefix}
                placeholder={t('sku.prefixExampleSelia')}
                onChange={(e) => onChange({ ...sku, prefix: e.target.value })}
              />
            </div>
            <p className="text-xs font-medium text-[#A3A3A3] sm:col-span-2">
              {t('sku.regexHint')}
            </p>
          </div>
        )}

        {sku.mode === 'none' && (
          <p className="text-xs font-medium text-[#A3A3A3]">
            {t('sku.noneHint')}
          </p>
        )}

        {/* Live SKU Sample Box */}
        {sampleSku && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-[#1A1A1A] p-3 text-xs border border-white/10">
            <span className="font-bold text-[#D4D4D4]">{t('sku.sampleTitle')}</span>
            <span className="rounded-md bg-[#222222] px-2.5 py-1 font-mono font-bold text-white border border-white/15">
              {t('sku.sampleProduct')} {sampleSku}
            </span>
            <span className="rounded-md bg-[#222222] px-2.5 py-1 font-mono font-bold text-white border border-white/15">
              {t('sku.sampleOption')} {sampleSku}-M
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
