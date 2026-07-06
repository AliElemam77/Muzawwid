import { F } from '../lib/salla'
import type { FieldSource, MappingConfig } from '../lib/types'
import { Card } from './ui'
import FieldMapper from './FieldMapper'
import ImageMerge from './ImageMerge'
import SkuGenerator from './SkuGenerator'
import OptionsEditor from './OptionsEditor'
import DefaultsEditor from './DefaultsEditor'

/**
 * Simple (one-cell) Salla fields the user maps directly.
 * Image, SKU, options, and the default-driven fields are handled by dedicated
 * sections below, so they are intentionally excluded here.
 */
const SIMPLE_FIELDS: { header: string; label: string; required?: boolean }[] = [
  { header: F.name, label: 'أسم المنتج', required: true },
  { header: F.price, label: 'سعر المنتج', required: true },
  { header: F.category, label: 'تصنيف المنتج' },
  { header: F.brand, label: 'الماركة' },
  { header: F.description, label: 'الوصف' },
  { header: F.imageAlt, label: 'وصف صورة المنتج' },
  { header: F.cost, label: 'سعر التكلفة' },
  { header: F.discountPrice, label: 'السعر المخفض' },
  { header: F.discountStart, label: 'تاريخ بداية التخفيض' },
  { header: F.discountEnd, label: 'تاريخ نهاية التخفيض' },
  { header: F.maxQty, label: 'اقصي كمية لكل عميل' },
  { header: F.barcode, label: 'الباركود' },
  { header: F.promoTitle, label: 'العنوان الترويجي' },
  { header: F.calories, label: 'السعرات الحرارية' },
  { header: F.mpn, label: 'MPN' },
  { header: F.gtin, label: 'GTIN' },
  { header: F.taxExemptReason, label: 'سبب عدم الخضوع للضريبة' },
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
  const setField = (header: string, source: FieldSource) =>
    onChange({ ...config, fields: { ...config.fields, [header]: source } })

  return (
    <div className="space-y-5">
      <Card title="الحقول الأساسية" subtitle="اربط كل حقل في سلة بعمود من ملفك، أو اضبط قيمة ثابتة، أو اتركه فارغًا.">
        <div className="space-y-2.5">
          {SIMPLE_FIELDS.map((f) => (
            <FieldMapper
              key={f.header}
              label={f.label}
              columns={columns}
              required={f.required}
              source={config.fields[f.header] ?? { kind: 'none' }}
              onChange={(source) => setField(f.header, source)}
            />
          ))}
        </div>
      </Card>

      <Card title="دمج الصور" subtitle="اختر عمودًا واحدًا أو أكثر لدمجها في «صورة المنتج».">
        <ImageMerge
          columns={columns}
          selected={config.imageColumns}
          onChange={(imageColumns) => onChange({ ...config, imageColumns })}
        />
      </Card>

      <Card title="توليد رمز المنتج (SKU)">
        <SkuGenerator
          columns={columns}
          sku={config.sku}
          onChange={(sku) => onChange({ ...config, sku })}
        />
      </Card>

      <Card title="الخيارات (المتغيرات)" subtitle="حتى ٣ خيارات — كل خيار يتوسّع إلى صفوف «خيار» أسفل المنتج.">
        <OptionsEditor
          columns={columns}
          options={config.options}
          onChange={(options) => onChange({ ...config, options })}
        />
      </Card>

      <Card title="القيم الافتراضية">
        <DefaultsEditor
          defaults={config.defaults}
          onChange={(defaults) => onChange({ ...config, defaults })}
        />
      </Card>
    </div>
  )
}
