import { useMemo, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { F } from '../lib/salla'
import type { FieldSource, MappingConfig, PriceField } from '../lib/types'
import type { SourceSheet } from '../lib/reader'
import type { PlatformId } from '../lib/platforms'
import { useI18n } from '../lib/i18n'
import { Card, Button, TextInput } from './ui'
import FieldMapper from './FieldMapper'
import ImageMerge from './ImageMerge'
import ImageScraper from './ImageScraper'
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
  options: ['tips.options.1', 'tips.options.2', 'tips.options.3'],
  defaults: ['tips.defaults.1', 'tips.defaults.2', 'tips.defaults.3'],
  export: ['tips.export.1', 'tips.export.2', 'tips.export.3'],
}

/**
 * `core` fields are the handful almost every import needs, and are the only
 * ones on screen to begin with. The rest live behind the "more fields" picker
 * under the grid — seventeen cards at once buried the two that are required.
 *
 * A non-core field is still shown automatically whenever it is already mapped
 * (autoMap guessed it, or a preset carried it), so nothing a user mapped can
 * hide itself.
 */
const SIMPLE_FIELDS: {
  header: string
  labelKey: string
  required?: boolean
  core?: boolean
}[] = [
  { header: F.name, labelKey: 'f.name', required: true, core: true },
  { header: F.price, labelKey: 'f.price', required: true, core: true },
  { header: F.category, labelKey: 'f.category', core: true },
  { header: F.brand, labelKey: 'f.brand', core: true },
  { header: F.description, labelKey: 'f.description', core: true },
  { header: F.discountPrice, labelKey: 'f.discountPrice', core: true },
  { header: F.imageAlt, labelKey: 'f.imageAlt' },
  { header: F.cost, labelKey: 'f.cost' },
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

/** Everything the user may take off the grid — a required field never can. */
const PICKABLE_FIELDS = SIMPLE_FIELDS.filter((f) => !f.required)

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

        return (
          <li key={s.key} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPick(i)}
              aria-current={isCurrent ? 'step' : undefined}
              className={`step-chip step-chip--clickable text-xs ${
                isCurrent ? 'step-chip--current' : isDone ? 'step-chip--done' : ''
              }`}
            >
              <span className="step-badge">
                {isDone ? <Check className="size-3 stroke-[3]" /> : i + 1}
              </span>
              <span>{t(s.shortKey)}</span>
            </button>
            {i < sections.length - 1 && (
              <span aria-hidden className={`step-line !w-2 ${isDone ? 'step-line--done' : ''}`} />
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
  /** Fields the user pulled onto the grid, and ones they took off it. */
  const [shownExtras, setShownExtras] = useState<Set<string>>(new Set())
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(new Set())

  const isMappedField = (header: string) => {
    const src = config.fields[header]
    return !!src && (src.kind === 'column' || src.kind === 'constant')
  }

  /**
   * Required first, then anything still mapped — a card carrying a real
   * mapping is never hidden, which is why the × is withheld until the field is
   * set to «بدون». Past that: core by default, plus whatever was pulled in,
   * minus whatever was dismissed.
   */
  const visibleFields = useMemo(
    () =>
      SIMPLE_FIELDS.filter((f) => {
        if (f.required || isMappedField(f.header)) return true
        if (hiddenFields.has(f.header)) return false
        return f.core || shownExtras.has(f.header)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.fields, shownExtras, hiddenFields],
  )

  const isFieldVisible = (header: string) =>
    visibleFields.some((f) => f.header === header)

  /** Take a card off the grid. Only ever called for unmapped, optional fields. */
  function hideField(header: string) {
    setShownExtras((prev) => {
      const next = new Set(prev)
      next.delete(header)
      return next
    })
    setHiddenFields((prev) => new Set(prev).add(header))
  }

  function toggleExtra(header: string) {
    if (isFieldVisible(header)) {
      hideField(header)
      return
    }
    setHiddenFields((prev) => {
      const next = new Set(prev)
      next.delete(header)
      return next
    })
    setShownExtras((prev) => new Set(prev).add(header))
  }

  const fieldCounts = useMemo(() => {
    let mapped = 0
    let unmapped = 0
    let required = 0
    // Counted over what is ON SCREEN, so the tab numbers and the grid agree.
    // The picker below carries the "X of Y in the whole schema" figure.
    for (const f of visibleFields) {
      if (f.required) required++
      const src = config.fields[f.header]
      if (src && (src.kind === 'column' || src.kind === 'constant')) {
        mapped++
      } else {
        unmapped++
      }
    }
    return { all: visibleFields.length, required, mapped, unmapped }
  }, [config.fields, visibleFields])

  const filteredSimpleFields = useMemo(() => {
    const q = searchField.toLowerCase().trim()
    // Searching is an explicit lookup, so it reaches hidden fields too —
    // otherwise typing «باركود» would find nothing at all.
    const pool = q ? SIMPLE_FIELDS : visibleFields
    return pool.filter((f) => {
      const src = config.fields[f.header]
      const isMapped = src && (src.kind === 'column' || src.kind === 'constant')

      if (fieldFilter === 'required' && !f.required) return false
      if (fieldFilter === 'mapped' && !isMapped) return false
      if (fieldFilter === 'unmapped' && isMapped) return false

      if (!q) return true
      return t(f.labelKey).toLowerCase().includes(q) || f.header.toLowerCase().includes(q)
    })
  }, [searchField, fieldFilter, config.fields, visibleFields, t])

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
                      className={`step-chip step-chip--clickable !py-1 text-xs ${
                        active ? 'step-chip--current' : ''
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="step-badge font-mono !text-[10px]">{tab.count}</span>
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
                  onHide={
                    f.required || isMappedField(f.header)
                      ? undefined
                      : () => hideField(f.header)
                  }
                />
              ))}
            </div>

            {/* The rest of the schema, opt-in. A field that is already mapped
                is locked on: hiding it would hide a real mapping. */}
            {!searchField.trim() && (
              <div className="rounded-xl border border-white/10 bg-[#111111] p-4">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-black text-white text-xs">{t('field.moreTitle')}</h3>
                  <span className="text-[10px] font-bold text-[#888888]">
                    {t('field.moreCount', {
                      shown: visibleFields.length,
                      total: SIMPLE_FIELDS.length,
                    })}
                  </span>
                </div>
                <p className="mb-3 text-[11px] font-medium text-[#A3A3A3]">
                  {t('field.moreHint')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PICKABLE_FIELDS.map((f) => {
                    const mapped = isMappedField(f.header)
                    const on = isFieldVisible(f.header)
                    return (
                      <button
                        key={f.header}
                        type="button"
                        disabled={mapped}
                        onClick={() => toggleExtra(f.header)}
                        title={mapped ? t('field.moreLocked') : undefined}
                        className={`rounded-full border px-3 py-1 text-[11px] font-bold transition ${
                          on
                            ? 'border-[#12b3a4]/45 bg-[#12b3a4]/15 text-[#2FE0CF]'
                            : 'border-white/12 bg-[#1A1A1A] text-[#D4D4D4] hover:border-white/30 hover:bg-[#262626] hover:text-white'
                        } ${mapped ? 'cursor-default' : ''}`}
                      >
                        <span className="me-1 font-black">{on ? '✓' : '+'}</span>
                        {t(f.labelKey)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Promo Title Special Block */}
            <div className="mt-4 rounded-xl border border-white/10 bg-[#141414] p-4">
              <h3 className="mb-2 font-black text-white text-xs">
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
            <ImageScraper
              sheet={sheet}
              config={config}
              alreadyFilled={filledImageRows}
              onFilled={onFillImages}
            />
          </>
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
            className="!border-white/15 !text-white hover:!bg-white/10"
          >
            {t('map.nav.prev')}
          </Button>
          <span className="font-bold text-xs text-[#A3A3A3]">
            {t('map.nav.progress', { n: clamped + 1, total: sections.length })}
          </span>
          <Button
            variant="ghost"
            onClick={() => changeSection(Math.min(sections.length - 1, clamped + 1))}
            disabled={clamped === sections.length - 1}
            className="!border-white/15 !text-white hover:!bg-white/10"
          >
            {t('map.nav.next')}
          </Button>
        </nav>

        <div className="flex justify-end border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onFinish}
            className="flex items-center gap-2 rounded-xl bg-[#FF6B50] px-6 py-2.5 text-xs sm:text-sm font-black text-[#050505] shadow-lg shadow-[#FF6B50]/20 transition-all hover:bg-[#ff856e] hover:scale-105 active:scale-95"
          >
            {t('map.finish')}
          </button>
        </div>
      </div>
    </div>
  )
}
