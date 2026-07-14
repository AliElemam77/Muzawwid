import { useState } from 'react'
import { F } from '../lib/salla'
import type { FieldSource, MappingConfig } from '../lib/types'
import type { SourceSheet } from '../lib/reader'
import type { PlatformId } from '../lib/platforms'
import { useI18n } from '../lib/i18n'
import { Card, Button } from './ui'
import FieldMapper from './FieldMapper'
import ImageMerge from './ImageMerge'
import SkuGenerator from './SkuGenerator'
import OptionsEditor from './OptionsEditor'
import DefaultsEditor from './DefaultsEditor'
import ExportOptionsEditor from './ExportOptionsEditor'
import MappingQuickView from './MappingQuickView'

/** Stable identifiers for the Map sub-steps (shared with MappingQuickView). */
export type SectionKey = 'fields' | 'images' | 'sku' | 'options' | 'defaults' | 'export'

interface SectionDef {
  key: SectionKey
  shortKey: string
  titleKey: string
  subtitleKey?: string
}

const BASE_SECTIONS: SectionDef[] = [
  { key: 'fields', shortKey: 'map.sec.fields', titleKey: 'map.fields.title', subtitleKey: 'map.fields.subtitle' },
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

/** Compact linear stepper for the Map sub-sections. Direction is handled by the
 *  document `dir` (logical flow): section 1 sits at the inline-start edge. */
function SubStepper({
  sections,
  active,
  onPick,
}: {
  sections: SectionDef[]
  active: number
  onPick: (i: number) => void
}) {
  const { t } = useI18n()
  return (
    <ol className="flex flex-wrap items-center gap-1.5">
      {sections.map((s, i) => {
        const done = i < active
        const current = i === active
        const chip = current
          ? 'bg-[color:var(--violet)] text-[color:var(--on-violet)]'
          : done
            ? 'bg-[color:var(--teal)] text-[color:var(--on-teal)]'
            : 'bg-white text-[color:var(--ink)]'
        return (
          <li key={s.key} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPick(i)}
              aria-current={current ? 'step' : undefined}
              className={`hard-2 lift flex items-center gap-1.5 px-2.5 py-1 ${chip}`}
              style={{ borderRadius: 'var(--r-pill)' }}
            >
              <span
                className="flex h-4.5 w-4.5 items-center justify-center border border-[color:var(--ink)] text-[11px] font-extrabold"
                style={{ borderRadius: 'var(--r-pill)', height: '1.15rem', width: '1.15rem' }}
              >
                {done ? '✓' : i + 1}
              </span>
              <span className="font-bold whitespace-nowrap" style={{ fontSize: 'var(--fs-label)' }}>
                {t(s.shortKey)}
              </span>
            </button>
            {i < sections.length - 1 && (
              <span aria-hidden className="h-0.5 w-3 bg-[color:var(--ink)]/40" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

/**
 * Column-mapping surface as a linear sub-stepper: one section at a time
 * (fields → images → SKU → options → defaults [→ export]), with a persistent
 * quick-view of the source file + a live snippet pinned beside every step.
 */
export default function MappingPanel({
  sheet,
  config,
  platform,
  onChange,
}: {
  sheet: SourceSheet
  config: MappingConfig
  platform: PlatformId
  onChange: (next: MappingConfig) => void
}) {
  const { t } = useI18n()
  const columns = sheet.headers
  const sections = platform === 'salla' ? BASE_SECTIONS : [...BASE_SECTIONS, EXPORT_SECTION]

  const [active, setActive] = useState(0)
  const clamped = Math.min(active, sections.length - 1)
  const section = sections[clamped]

  const setField = (header: string, source: FieldSource) =>
    onChange({ ...config, fields: { ...config.fields, [header]: source } })

  function editor() {
    switch (section.key) {
      case 'fields':
        return (
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
        )
      case 'images':
        return (
          <ImageMerge
            columns={columns}
            selected={config.imageColumns}
            onChange={(imageColumns) => onChange({ ...config, imageColumns })}
          />
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
            onQuantityChange={(quantity) => onChange({ ...config, quantity })}
            onPriceRulesChange={(priceRules) => onChange({ ...config, priceRules })}
          />
        )
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
      {/* --- Left: sub-stepper + the active section only ---------------------- */}
      <div className="space-y-4">
        <SubStepper sections={sections} active={clamped} onPick={setActive} />

        <Card title={t(section.titleKey)} subtitle={section.subtitleKey ? t(section.subtitleKey) : undefined}>
          {editor()}
        </Card>

        <nav className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => setActive((i) => Math.max(0, i - 1))}
            disabled={clamped === 0}
          >
            {t('map.nav.prev')}
          </Button>
          <span className="font-bold text-[color:var(--ink)]/60" style={{ fontSize: 'var(--fs-label)' }}>
            {t('map.nav.progress', { n: clamped + 1, total: sections.length })}
          </span>
          <Button
            variant="secondary"
            onClick={() => setActive((i) => Math.min(sections.length - 1, i + 1))}
            disabled={clamped === sections.length - 1}
          >
            {t('map.nav.next')}
          </Button>
        </nav>
      </div>

      {/* --- Right: persistent quick-view (file + live snippet) --------------- */}
      <aside className="self-start lg:sticky lg:top-4">
        <MappingQuickView sheet={sheet} config={config} section={section.key} platform={platform} />
      </aside>
    </div>
  )
}
