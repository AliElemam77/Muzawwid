import { useMemo, useRef, useState } from 'react'
import { F } from '../lib/salla'
import type { FieldSource, MappingConfig, PriceField } from '../lib/types'
import type { SourceSheet } from '../lib/reader'
import type { PlatformId } from '../lib/platforms'
import { useI18n } from '../lib/i18n'
import { Card, Button, TextInput } from './ui'
import FieldMapper from './FieldMapper'
import ImageMerge from './ImageMerge'
import ImageScraper from './ImageScraper'
import SkuGenerator from './SkuGenerator'
import OptionsEditor from './OptionsEditor'
import PromoTitleEditor from './PromoTitleEditor'
import DefaultsEditor from './DefaultsEditor'
import DescriptionTemplateEditor from './DescriptionTemplateEditor'
import ExportOptionsEditor from './ExportOptionsEditor'
import StepTips from './StepTips'

/** Stable identifiers for the Map sub-steps (shared with MappingQuickView). */
export type SectionKey =
  | 'fields'
  | 'description'
  | 'images'
  | 'sku'
  | 'options'
  | 'defaults'
  | 'export'

interface SectionDef {
  key: SectionKey
  shortKey: string
  titleKey: string
  subtitleKey?: string
}

const BASE_SECTIONS: SectionDef[] = [
  { key: 'fields', shortKey: 'map.sec.fields', titleKey: 'map.fields.title', subtitleKey: 'map.fields.subtitle' },
  { key: 'description', shortKey: 'map.sec.description', titleKey: 'tpl.title', subtitleKey: 'tpl.subtitle' },
  { key: 'images', shortKey: 'map.sec.images', titleKey: 'map.images.title', subtitleKey: 'map.images.subtitle' },
  { key: 'sku', shortKey: 'map.sec.sku', titleKey: 'map.sku.title' },
  { key: 'options', shortKey: 'map.sec.options', titleKey: 'map.options.title', subtitleKey: 'map.options.subtitle' },
  { key: 'defaults', shortKey: 'map.sec.defaults', titleKey: 'map.defaults.title' },
]

const EXPORT_SECTION: SectionDef = {
  key: 'export',
  shortKey: 'map.sec.export',
  titleKey: 'export.title',
  subtitleKey: 'export.subtitle',
}

const PRICES_SECTION: SectionDef = {
  key: 'export',
  shortKey: 'map.sec.prices',
  titleKey: 'prices.title',
  subtitleKey: 'prices.subtitle',
}

const SECTION_TIP_KEYS: Record<SectionKey, string[]> = {
  fields: ['tips.fields.1', 'tips.fields.2', 'tips.fields.3'],
  description: ['tips.description.1', 'tips.description.2', 'tips.description.3'],
  images: ['tips.images.1', 'tips.images.2', 'tips.images.3'],
  sku: ['tips.sku.1', 'tips.sku.2', 'tips.sku.3'],
  options: ['tips.options.1', 'tips.options.2', 'tips.options.3'],
  defaults: ['tips.defaults.1', 'tips.defaults.2', 'tips.defaults.3'],
  export: ['tips.export.1', 'tips.export.2', 'tips.export.3'],
}

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

/** Linear stepper for the Map sub-sections with completion indicators. */
function SubStepper({
  sections,
  active,
  completedMap,
  onPick,
}: {
  sections: SectionDef[]
  active: number
  completedMap: Record<SectionKey, boolean>
  onPick: (i: number) => void
}) {
  const { t } = useI18n()
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {sections.map((s, i) => {
        const isCurrent = i === active
        const isDone = completedMap[s.key]
        const chip = isCurrent
          ? 'bg-[color:var(--violet)] text-[color:var(--on-violet)]'
          : isDone
            ? 'bg-[color:var(--teal)] text-[color:var(--on-teal)]'
            : 'bg-white text-[color:var(--ink)]'
        return (
          <li key={s.key} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPick(i)}
              aria-current={isCurrent ? 'step' : undefined}
              className={`hard-2 lift flex items-center gap-1.5 px-3 py-1.5 ${chip}`}
              style={{ borderRadius: 'var(--r-pill)' }}
            >
              <span
                className="flex h-5 w-5 items-center justify-center border border-[color:var(--ink)] text-[11px] font-extrabold shadow-xs"
                style={{ borderRadius: 'var(--r-pill)' }}
              >
                {isDone ? '✓' : i + 1}
              </span>
              <span className="font-bold whitespace-nowrap" style={{ fontSize: 'var(--fs-label)' }}>
                {t(s.shortKey)}
              </span>
            </button>
            {i < sections.length - 1 && (
              <span aria-hidden className="hidden h-0.5 w-2 bg-[color:var(--ink)]/30 sm:block" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default function MappingPanel({
  sheet,
  config,
  platform,
  onChange,
  filledImageRows,
  onFillImages,
  onFinish,
}: {
  sheet: SourceSheet
  config: MappingConfig
  platform: PlatformId
  onChange: (next: MappingConfig) => void
  /** Source rows that already have an image edit — nothing to fetch for them. */
  filledImageRows: ReadonlySet<number>
  /** Gallery images fetched from the product pages, keyed by source row index. */
  onFillImages: (images: Record<number, string>) => void
  onFinish: () => void
}) {
  const { t } = useI18n()
  const columns = sheet.headers
  const isSalla = platform === 'salla'
  const sections = [...BASE_SECTIONS, isSalla ? PRICES_SECTION : EXPORT_SECTION]

  const [active, setActive] = useState(0)
  const [searchField, setSearchField] = useState('')
  const panelTopRef = useRef<HTMLDivElement>(null)
  const clamped = Math.min(active, sections.length - 1)
  const section = sections[clamped]

  /** Sample first non-empty value for each column in the sheet. */
  const sampleValues = useMemo(() => {
    const samples: Record<string, string> = {}
    for (const col of sheet.headers) {
      for (const r of sheet.rows) {
        const val = String(r[col] ?? '').trim()
        if (val) {
          samples[col] = val
          break
        }
      }
    }
    return samples
  }, [sheet])

  /** Track completion of key sections for visual progress. */
  const completedMap: Record<SectionKey, boolean> = useMemo(() => {
    const nameMapped =
      config.fields[F.name]?.kind === 'column' || config.fields[F.name]?.kind === 'constant'
    const priceMapped =
      config.fields[F.price]?.kind === 'column' || config.fields[F.price]?.kind === 'constant'

    return {
      fields: Boolean(nameMapped && priceMapped),
      description: Boolean(config.descriptionTemplate?.enabled),
      images: config.imageColumns.length > 0 || filledImageRows.size > 0,
      sku: config.sku.mode !== 'none',
      options: config.options.length > 0,
      defaults: true,
      export: config.priceRules.length > 0 || config.quantity.mode !== 'source',
    }
  }, [config, filledImageRows])

  const priceFieldLabel: Record<PriceField, string> = isSalla
    ? { price: t('f.price'), salePrice: t('f.discountPrice'), cost: t('f.cost') }
    : { price: 'price', salePrice: 'sale_price', cost: 'cost' }

  const setField = (header: string, source: FieldSource) =>
    onChange({ ...config, fields: { ...config.fields, [header]: source } })

  function changeSection(index: number) {
    setActive(index)
    requestAnimationFrame(() => panelTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const [fieldFilter, setFieldFilter] = useState<'all' | 'required' | 'mapped' | 'unmapped'>('all')

  const fieldCounts = useMemo(() => {
    let mapped = 0
    let unmapped = 0
    let required = 0
    for (const f of SIMPLE_FIELDS) {
      if (f.required) required++
      const src = config.fields[f.header]
      if (src && (src.kind === 'column' || src.kind === 'constant')) {
        mapped++
      } else {
        unmapped++
      }
    }
    return { all: SIMPLE_FIELDS.length, required, mapped, unmapped }
  }, [config.fields])

  const filteredSimpleFields = useMemo(() => {
    const q = searchField.toLowerCase().trim()
    return SIMPLE_FIELDS.filter((f) => {
      const src = config.fields[f.header]
      const isMapped = src && (src.kind === 'column' || src.kind === 'constant')

      if (fieldFilter === 'required' && !f.required) return false
      if (fieldFilter === 'mapped' && !isMapped) return false
      if (fieldFilter === 'unmapped' && isMapped) return false

      if (!q) return true
      return t(f.labelKey).toLowerCase().includes(q) || f.header.toLowerCase().includes(q)
    })
  }, [searchField, fieldFilter, config.fields, t])

  function editor() {
    switch (section.key) {
      case 'fields':
        return (
          <div className="space-y-4">
            {/* Filter Tabs & Search */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { key: 'all', label: t('field.filterAll'), count: fieldCounts.all },
                    { key: 'required', label: t('field.filterRequired'), count: fieldCounts.required },
                    { key: 'mapped', label: t('field.filterMapped'), count: fieldCounts.mapped },
                    { key: 'unmapped', label: t('field.filterUnmapped'), count: fieldCounts.unmapped },
                  ] as const
                ).map((tab) => {
                  const active = fieldFilter === tab.key
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setFieldFilter(tab.key)}
                      className={`hard-2 lift flex items-center gap-1.5 px-3 py-1 text-xs font-bold transition ${
                        active
                          ? 'bg-[color:var(--violet)] text-[color:var(--on-violet)]'
                          : 'bg-white text-[color:var(--ink)] hover:bg-[color:var(--cream)]'
                      }`}
                      style={{ borderRadius: 'var(--r-pill)' }}
                    >
                      <span>{tab.label}</span>
                      <span className="rounded-full bg-black/10 px-1 text-[10px]">
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="max-w-xs">
                <TextInput
                  value={searchField}
                  placeholder={t('field.searchPlaceholder')}
                  onChange={(e) => setSearchField(e.target.value)}
                  className="!py-1 !text-xs min-w-44"
                />
              </div>
            </div>

            {/* Responsive Grid of Field Cards */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSimpleFields.map((f) => (
                <FieldMapper
                  key={f.header}
                  label={t(f.labelKey)}
                  columns={columns}
                  required={f.required}
                  sampleValues={sampleValues}
                  source={config.fields[f.header] ?? { kind: 'none' }}
                  onChange={(source) => setField(f.header, source)}
                />
              ))}
            </div>

            {/* Promo Title Special Block */}
            <div className="mt-4 rounded-xl border-2 border-[color:var(--ink)] bg-[color:var(--cream)]/40 p-4">
              <h3 className="mb-2 font-extrabold text-[color:var(--ink)]" style={{ fontSize: 'var(--fs-label)' }}>
                {t('promo.title')}
              </h3>
              <PromoTitleEditor
                promoTitle={config.promoTitle}
                onChange={(promoTitle) => onChange({ ...config, promoTitle })}
              />
            </div>
          </div>
        )
      case 'description':
        return (
          <DescriptionTemplateEditor
            sheet={sheet}
            config={config}
            onChange={(descriptionTemplate) => onChange({ ...config, descriptionTemplate })}
          />
        )
      case 'images':
        return (
          <>
            <ImageMerge
              columns={columns}
              selected={config.imageColumns}
              onChange={(imageColumns) => onChange({ ...config, imageColumns })}
            />
            {isSalla && (
              <ImageScraper
                sheet={sheet}
                config={config}
                alreadyFilled={filledImageRows}
                onFilled={onFillImages}
              />
            )}
          </>
        )
      case 'sku':
        return (
          <SkuGenerator
            columns={columns}
            sku={config.sku}
            onChange={(sku) => onChange({ ...config, sku })}
          />
        )
      case 'options':
        return (
          <OptionsEditor
            columns={columns}
            options={config.options}
            onChange={(options) => onChange({ ...config, options })}
          />
        )
      case 'defaults':
        return (
          <DefaultsEditor
            defaults={config.defaults}
            onChange={(defaults) => onChange({ ...config, defaults })}
          />
        )
      case 'export':
        return (
          <ExportOptionsEditor
            quantity={config.quantity}
            priceRules={config.priceRules}
            fieldLabel={priceFieldLabel}
            showQuantity={!isSalla}
            onQuantityChange={(quantity) => onChange({ ...config, quantity })}
            onPriceRulesChange={(priceRules) => onChange({ ...config, priceRules })}
          />
        )
    }
  }

  return (
    <div ref={panelTopRef} className="space-y-4">
      <div className="space-y-4">
        <SubStepper
          sections={sections}
          active={clamped}
          completedMap={completedMap}
          onPick={changeSection}
        />

        <Card title={t(section.titleKey)}>
          <div className="mb-3">
            <StepTips tips={SECTION_TIP_KEYS[section.key].map((key) => t(key))} />
          </div>
          {editor()}
        </Card>

        <nav className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => changeSection(Math.max(0, clamped - 1))}
            disabled={clamped === 0}
          >
            {t('map.nav.prev')}
          </Button>
          <span className="font-bold text-[color:var(--ink)]/60" style={{ fontSize: 'var(--fs-label)' }}>
            {t('map.nav.progress', { n: clamped + 1, total: sections.length })}
          </span>
          <Button
            variant="secondary"
            onClick={() => changeSection(Math.min(sections.length - 1, clamped + 1))}
            disabled={clamped === sections.length - 1}
          >
            {t('map.nav.next')}
          </Button>
        </nav>

        <div className="flex justify-end border-t border-[color:var(--ink)]/15 pt-4">
          <Button onClick={onFinish}>{t('map.finish')}</Button>
        </div>
      </div>
    </div>
  )
}
