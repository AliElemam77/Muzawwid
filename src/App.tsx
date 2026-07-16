import { useMemo, useRef, useState } from 'react'
import type { SourceWorkbook } from './lib/reader'
import type { MappingConfig, Preset } from './lib/types'
import { autoMap } from './lib/automap'
import {
  buildRows,
  validate,
  optionValueKey,
  type RowOverrides,
  type OptionOverrides,
} from './lib/build'
import { F } from './lib/salla'
import { buildSallaWorkbook, downloadWorkbook } from './lib/salla'
import { buildProducts } from './lib/product'
import { getAdapter } from './lib/adapters'
import { loadPresets, savePreset, deletePreset } from './lib/presets'
import { loadCategories, saveCategories } from './lib/categories'
import { loadPlatform, savePlatform, PLATFORMS, type PlatformId } from './lib/platforms'
import { LINKS } from './lib/links'
import { useI18n } from './lib/i18n'

import Logo from './components/Logo'
import MadeBy from './components/MadeBy'
import AuthorCredit from './components/AuthorCredit'
import Landing from './components/Landing'
import PlatformSwitcher from './components/PlatformSwitcher'
import PlatformComingSoon from './components/PlatformComingSoon'
import Stepper from './components/Stepper'
import Uploader from './components/Uploader'
import SourcePreview from './components/SourcePreview'
import MappingPanel from './components/MappingPanel'
import CategoriesManager from './components/CategoriesManager'
import OutputPreview from './components/OutputPreview'
import ZidPreview from './components/ZidPreview'
import ValidationSummary from './components/ValidationSummary'
import PresetBar from './components/PresetBar'
import { Card, Button } from './components/ui'

export default function App() {
  const { t, lang, setLang } = useI18n()
  const [workbook, setWorkbook] = useState<SourceWorkbook | null>(null)
  const [sheetName, setSheetName] = useState('')
  const [config, setConfig] = useState<MappingConfig | null>(null)
  const [presets, setPresets] = useState<Preset[]>(() => loadPresets())
  // Manual per-product edits (name / price / category), keyed by source row index.
  const [rowOverrides, setRowOverrides] = useState<RowOverrides>({})
  // Manual per-product option edits (rename an axis/value, drop a value).
  const [optionOverrides, setOptionOverrides] = useState<OptionOverrides>({})
  // Items (source rows) the user removed from the export.
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set())
  // The store's category list — persisted across files, chosen from per product.
  const [storeCategories, setStoreCategories] = useState<string[]>(() => loadCategories())
  // Selected export target platform (only Salla is implemented today).
  const [platform, setPlatform] = useState<PlatformId>(() => loadPlatform())

  const sheet = useMemo(
    () => workbook?.sheets.find((s) => s.name === sheetName) ?? null,
    [workbook, sheetName],
  )

  const adapter = getAdapter(platform)

  // Salla keeps its dedicated (sheet + config) pipeline.
  const build = useMemo(
    () =>
      platform === 'salla' && sheet && config
        ? buildRows(sheet, config, rowOverrides, excludedRows, optionOverrides)
        : null,
    [platform, sheet, config, rowOverrides, excludedRows, optionOverrides],
  )

  // Canonical products power every adapter platform (Zid, …).
  const products = useMemo(
    () =>
      adapter && sheet && config
        ? buildProducts(sheet, config, rowOverrides, excludedRows)
        : null,
    [adapter, sheet, config, rowOverrides, excludedRows],
  )

  const validation = useMemo(() => {
    if (platform === 'salla') return build ? validate(build.rows) : null
    return adapter && products ? adapter.validate(products) : null
  }, [platform, build, adapter, products])

  const step: 1 | 2 | 3 = !workbook ? 1 : validation?.ok ? 3 : 2

  function handleLoaded(wb: SourceWorkbook) {
    const first = wb.sheets[0]
    setWorkbook(wb)
    setSheetName(first.name)
    setConfig(autoMap(first))
    setRowOverrides({})
    setExcludedRows(new Set())
    setOptionOverrides({})
  }

  function handlePickSheet(name: string) {
    const s = workbook?.sheets.find((x) => x.name === name)
    if (!s) return
    setSheetName(name)
    // Re-run auto-mapping for the newly selected sheet.
    setConfig(autoMap(s))
    // Row indices no longer correspond to the previous sheet — clear edits.
    setRowOverrides({})
    setExcludedRows(new Set())
    setOptionOverrides({})
  }

  function handleReset() {
    setWorkbook(null)
    setSheetName('')
    setConfig(null)
    setRowOverrides({})
    setExcludedRows(new Set())
    setOptionOverrides({})
  }

  function handleEditField(sourceIndex: number, field: string, value: string) {
    setRowOverrides((prev) => ({
      ...prev,
      [sourceIndex]: { ...prev[sourceIndex], [field]: value },
    }))
  }

  function handleRenameAxis(sourceIndex: number, axisIndex: number, name: string) {
    setOptionOverrides((prev) => {
      const edits = prev[sourceIndex] ?? {}
      return {
        ...prev,
        [sourceIndex]: { ...edits, names: { ...edits.names, [axisIndex]: name } },
      }
    })
  }

  function handleEditOptionValue(
    sourceIndex: number,
    axisIndex: number,
    original: string,
    value: string,
  ) {
    setOptionOverrides((prev) => {
      const edits = prev[sourceIndex] ?? {}
      return {
        ...prev,
        [sourceIndex]: {
          ...edits,
          values: { ...edits.values, [optionValueKey(axisIndex, original)]: value },
        },
      }
    })
  }

  function handleRemoveOptionValue(sourceIndex: number, axisIndex: number, original: string) {
    setOptionOverrides((prev) => {
      const edits = prev[sourceIndex] ?? {}
      const key = optionValueKey(axisIndex, original)
      return {
        ...prev,
        [sourceIndex]: { ...edits, removed: [...new Set([...(edits.removed ?? []), key])] },
      }
    })
  }

  function handleApplyCategoryToAll(value: string) {
    // Product source indices come from whichever pipeline is active.
    const indices = build
      ? build.meta.filter((m) => m.isProduct).map((m) => m.sourceIndex)
      : (products?.map((p) => p.sourceIndex) ?? [])
    setRowOverrides((prev) => {
      const next = { ...prev }
      for (const idx of indices) {
        next[idx] = { ...next[idx], [F.category]: value }
      }
      return next
    })
  }

  function handleDeleteItem(sourceIndex: number) {
    setExcludedRows((prev) => new Set(prev).add(sourceIndex))
  }

  function handleCategoriesChange(next: string[]) {
    setStoreCategories(saveCategories(next))
  }

  /** Undo both kinds of removal: deleted items and dropped option values. */
  function handleRestoreAll() {
    setExcludedRows(new Set())
    setOptionOverrides((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([idx, edits]) => [idx, { ...edits, removed: [] }]),
      ),
    )
  }

  const removedOptionCount = useMemo(
    () =>
      Object.values(optionOverrides).reduce((n, edits) => n + (edits.removed?.length ?? 0), 0),
    [optionOverrides],
  )

  function handlePlatformChange(id: PlatformId) {
    setPlatform(savePlatform(id))
  }

  const activePlatform = PLATFORMS.find((p) => p.id === platform)!

  /** Landing CTAs jump to the tool rather than navigating — it's one page. */
  const toolRef = useRef<HTMLDivElement>(null)
  function scrollToTool() {
    toolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleExport() {
    if (!validation?.ok) return
    if (platform === 'salla') {
      if (!build) return
      downloadWorkbook(buildSallaWorkbook(build.rows), 'salla-import.xlsx')
    } else if (adapter && products) {
      downloadWorkbook(adapter.serialize(products), adapter.fileName)
    }
  }

  return (
    <div className="min-h-full">
      <header className="border-b-[3px] border-[color:var(--ink)] bg-[color:var(--cream)]">
        <div className="mx-auto flex max-w-[104rem] items-center justify-between gap-4 px-6 py-3">
          <Logo />
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="hard-2 lift bg-white px-3 py-1.5 font-bold text-[color:var(--ink)]"
              style={{ borderRadius: 'var(--r-pill)', fontSize: 'var(--fs-label)' }}
            >
              {t('lang.other')}
            </button>
            {!workbook && <Button onClick={scrollToTool}>{t('lp.cta.primary')}</Button>}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[104rem] px-6 py-6">
        {/* The landing only exists before a file is loaded — once you are
            mapping, it would just be noise between you and your data. */}
        {!workbook && <Landing onStart={scrollToTool} />}

        <div ref={toolRef} className="mb-6 card p-4" style={{ borderColor: 'var(--ink)' }}>
          <p
            className="font-extrabold text-[color:var(--ink)]"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-label)' }}
          >
            {t('hint.scraper.title')}
          </p>
          <p className="mt-1 text-[color:var(--ink)]/70" style={{ fontSize: 'var(--fs-label)' }}>
            {t('hint.scraper.body')}
          </p>
        </div>

        <div className="mb-8">
          <PlatformSwitcher value={platform} onChange={handlePlatformChange} />
        </div>

        {platform !== 'salla' && !adapter ? (
          <PlatformComingSoon
            platform={activePlatform}
            onBackToSalla={() => handlePlatformChange('salla')}
          />
        ) : (
          <>
            <div className="mb-8">
              <Stepper current={step} />
            </div>

            <div className="space-y-6">
              {/* Step 1: Upload */}
              {!workbook ? (
            <Card title={t('step1.uploadTitle')} subtitle={t('step1.uploadSubtitle')}>
              <Uploader onLoaded={handleLoaded} />
            </Card>
          ) : (
            <Card title={t('step1.sourceTitle')} subtitle={workbook.fileName}>
              {sheet && (
                <SourcePreview
                  workbook={workbook}
                  sheet={sheet}
                  onPickSheet={handlePickSheet}
                />
              )}
              <div className="mt-4">
                <Button variant="ghost" onClick={handleReset}>
                  {t('btn.uploadAnother')}
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: Map */}
          {workbook && sheet && config && (
            <>
              <Card title={t('presets.title')} subtitle={t('presets.subtitle')}>
                <PresetBar
                  presets={presets}
                  onSave={(name) => setPresets(savePreset(name, config))}
                  onLoad={(c) => setConfig(c)}
                  onDelete={(name) => setPresets(deletePreset(name))}
                />
              </Card>

              <Card title={t('categories.title')} subtitle={t('categories.subtitle')}>
                <CategoriesManager
                  categories={storeCategories}
                  onChange={handleCategoriesChange}
                />
              </Card>

              <h2 className="pt-2 text-xl font-bold text-slate-900">{t('step2.title')}</h2>
              <MappingPanel
                sheet={sheet}
                config={config}
                platform={platform}
                onChange={setConfig}
              />
            </>
          )}

          {/* Step 3: Preview + validate + export */}
          {workbook && sheet && config && validation && (
            <>
              <h2 className="pt-2 text-xl font-bold text-slate-900">{t('step3.title')}</h2>
              {platform === 'salla' && build ? (
                <Card title={t('preview.title')} subtitle={t('preview.subtitle')}>
                  <OutputPreview
                    rows={build.rows}
                    meta={build.meta}
                    categories={storeCategories}
                    productCount={build.productCount}
                    optionCount={build.optionCount}
                    excludedCount={excludedRows.size}
                    removedOptionCount={removedOptionCount}
                    onEditField={handleEditField}
                    onApplyCategoryToAll={handleApplyCategoryToAll}
                    onDeleteItem={handleDeleteItem}
                    onRestoreAll={handleRestoreAll}
                    onRenameAxis={handleRenameAxis}
                    onEditOptionValue={handleEditOptionValue}
                    onRemoveOptionValue={handleRemoveOptionValue}
                  />
                </Card>
              ) : products ? (
                <Card title={t('preview.title')} subtitle={t('zid.subtitle')}>
                  <ZidPreview
                    products={products}
                    categories={storeCategories}
                    excludedCount={excludedRows.size}
                    onEditField={handleEditField}
                    onApplyCategoryToAll={handleApplyCategoryToAll}
                    onDeleteItem={handleDeleteItem}
                    onRestoreAll={handleRestoreAll}
                  />
                </Card>
              ) : null}

              <Card title={t('validate.title')}>
                <ValidationSummary validation={validation} />
                <div className="mt-4 flex items-center gap-3">
                  <Button onClick={handleExport} disabled={!validation.ok}>
                    {t('btn.download')}
                  </Button>
                  {!validation.ok && (
                    <span className="text-sm text-red-600">{t('validate.fixErrors')}</span>
                  )}
                </div>
              </Card>
                </>
              )}
            </div>
          </>
        )}

        {/* Outside the platform branch: the credits and the Salla note belong
            on every screen, including "coming soon". */}
        <footer className="mt-12 border-t-[3px] border-[color:var(--ink)] pt-7 pb-10 text-center">
          {/* Under-development note — sets expectations and gives a direct line
              for problems (mustard = the app's "warning/heads-up" tone). */}
          <div className="mx-auto mb-7 max-w-xl">
            <span className="pill pill--mustard pill--solid">{t('footer.betaBadge')}</span>
            <p
              className="mt-3 leading-relaxed text-[color:var(--ink)]/75"
              style={{ fontSize: 'var(--fs-body)' }}
            >
              {t('footer.betaBody')}{' '}
              <a
                href={LINKS.linkedin}
                target="_blank"
                rel="noreferrer"
                className="font-extrabold text-[color:var(--ink)] underline decoration-2 underline-offset-2"
              >
                {t('footer.betaCta')}
              </a>
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 ">
            <AuthorCredit />
            <MadeBy />
          </div>
          <p
            className="mx-auto mt-5 max-w-2xl text-[color:var(--ink)]/50"
            style={{ fontSize: 'var(--fs-label)' }}
          >
            {t('app.footer')} <span dir="ltr">s.salla.sa/import/products</span>
          </p>
        </footer>
      </div>
    </div>
  )
}
