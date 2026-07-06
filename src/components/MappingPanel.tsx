import { F } from '../lib/salla'
import type { FieldSource, MappingConfig } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { Card } from './ui'
import FieldMapper from './FieldMapper'
import ImageMerge from './ImageMerge'
import SkuGenerator from './SkuGenerator'
import OptionsEditor from './OptionsEditor'
import DefaultsEditor from './DefaultsEditor'

/**
 * Simple (one-cell) Salla fields the user maps directly, keyed to i18n labels.
 * Image, SKU, options, and the default-driven fields are handled by dedicated
 * sections below, so they are intentionally excluded here.
 */
const SIMPLE_FIELDS: { header: string; labelKey: string; required?: boolean }[] = [
  { header: F.name, labelKey: 'f.name', required: true },
  { header: F.price, labelKey: 'f.price', required: true },
  { header: F.category, labelKey: 'f.category' },
  { header: F.brand, labelKey: 'f.brand' },
  { header: F.description, labelKey: 'f.description' },
  { header: F.imageAlt, labelKey: 'f.imageAlt' },
  { header: F.cost, labelKey: 'f.cost' },
  { header: F.discountPrice, labelKey: 'f.discountPrice' },
  { header: F.discountStart, labelKey: 'f.discountStart' },
  { header: F.discountEnd, labelKey: 'f.discountEnd' },
  { header: F.maxQty, labelKey: 'f.maxQty' },
  { header: F.barcode, labelKey: 'f.barcode' },
  { header: F.promoTitle, labelKey: 'f.promoTitle' },
  { header: F.calories, labelKey: 'f.calories' },
  { header: F.mpn, labelKey: 'f.mpn' },
  { header: F.gtin, labelKey: 'f.gtin' },
  { header: F.taxExemptReason, labelKey: 'f.taxExemptReason' },
]

/** Full column-mapping surface: fields, images, SKU, options, and defaults. */
export default function MappingPanel({
  columns,
  config,
  onChange,
}: {
  columns: string[]
  config: MappingConfig
  onChange: (next: MappingConfig) => void
}) {
  const { t } = useI18n()
  const setField = (header: string, source: FieldSource) =>
    onChange({ ...config, fields: { ...config.fields, [header]: source } })

  return (
    <div className="space-y-5">
      <Card title={t('map.fields.title')} subtitle={t('map.fields.subtitle')}>
        <div className="space-y-2.5">
          {SIMPLE_FIELDS.map((f) => (
            <FieldMapper
              key={f.header}
              label={t(f.labelKey)}
              columns={columns}
              required={f.required}
              source={config.fields[f.header] ?? { kind: 'none' }}
              onChange={(source) => setField(f.header, source)}
            />
          ))}
        </div>
      </Card>

      <Card title={t('map.images.title')} subtitle={t('map.images.subtitle')}>
        <ImageMerge
          columns={columns}
          selected={config.imageColumns}
          onChange={(imageColumns) => onChange({ ...config, imageColumns })}
        />
      </Card>

      <Card title={t('map.sku.title')}>
        <SkuGenerator
          columns={columns}
          sku={config.sku}
          onChange={(sku) => onChange({ ...config, sku })}
        />
      </Card>

      <Card title={t('map.options.title')} subtitle={t('map.options.subtitle')}>
        <OptionsEditor
          columns={columns}
          options={config.options}
          onChange={(options) => onChange({ ...config, options })}
        />
      </Card>

      <Card title={t('map.defaults.title')}>
        <DefaultsEditor
          defaults={config.defaults}
          onChange={(defaults) => onChange({ ...config, defaults })}
        />
      </Card>
    </div>
  )
}
