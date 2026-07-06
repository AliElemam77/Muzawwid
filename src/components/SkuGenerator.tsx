import type { SkuConfig } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { Select, TextInput, Label } from './ui'

const MODE_KEYS: { mode: SkuConfig['mode']; key: string }[] = [
  { mode: 'none', key: 'sku.none' },
  { mode: 'column', key: 'sku.column' },
  { mode: 'regex', key: 'sku.regex' },
  { mode: 'auto', key: 'sku.auto' },
]

/** Configure how رمز المنتج sku is produced. Variant sku = {parentSku}-{value}. */
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
        return onChange({ mode: 'regex', column: columns[0] ?? '', prefix: '' })
      case 'auto':
        return onChange({ mode: 'auto', prefix: '' })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {MODE_KEYS.map(({ mode, key }) => (
          <button
            key={mode}
            onClick={() => pickMode(mode)}
            className={
              'rounded-lg px-3 py-1.5 text-sm font-semibold transition ' +
              (sku.mode === mode
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
            }
          >
            {t(key)}
          </button>
        ))}
      </div>

      {sku.mode === 'column' && (
        <div className="max-w-sm">
          <Label>{t('sku.colLabel')}</Label>
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

      {sku.mode === 'regex' && (
        <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>{t('sku.urlColLabel')}</Label>
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
          <div>
            <Label>{t('sku.prefix')}</Label>
            <TextInput
              value={sku.prefix}
              placeholder={t('sku.prefixExampleSelia')}
              onChange={(e) => onChange({ ...sku, prefix: e.target.value })}
            />
          </div>
          <p className="text-xs text-slate-500 sm:col-span-2">{t('sku.regexHint')}</p>
        </div>
      )}

      {sku.mode === 'auto' && (
        <div className="max-w-sm">
          <Label>{t('sku.prefix')}</Label>
          <TextInput
            value={sku.prefix}
            placeholder={t('sku.prefixExampleSku')}
            onChange={(e) => onChange({ mode: 'auto', prefix: e.target.value })}
          />
          <p className="mt-1 text-xs text-slate-500">{t('sku.autoHint')}</p>
        </div>
      )}
    </div>
  )
}
