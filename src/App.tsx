import { useMemo, useRef, useState } from 'react'
import { readWorkbook, type SourceWorkbook } from './lib/reader'
import type { MappingConfig } from './lib/types'
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
import { loadHistory, saveHistory, deleteHistory, clearHistory } from './lib/history'
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
import Sidebar from './components/Sidebar'
import Modal from './components/Modal'
import ExportSaveDialog from './components/ExportSaveDialog'
import StepTips from './components/StepTips'
import { Card, Button } from './components/ui'
import ModeSelector, { type Mode } from './features/quantities/components/ModeSelector'
import QuantitiesStandalone from './features/quantities/components/QuantitiesStandalone'
import SavedSheets from './components/SavedSheets'
import ToastContainer from './components/Toast'
import type { HistoryItem } from './lib/types'

export default function App() {
  const { t, lang, setLang } = useI18n()
  const [workbook, setWorkbook] = useState<SourceWorkbook | null>(null)
  const [sheetName, setSheetName] = useState('')
  const [config, setConfig] = useState<MappingConfig | null>(null)
  const [history, setHistory] = useState(() => loadHistory())
  const [showSidebar, setShowSidebar] = useState(false)
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
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1)
  const [showCategories, setShowCategories] = useState(false)
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  // Open while asking whether to keep a copy of this export on the device.
  const [exportPrompt, setExportPrompt] = useState(false)
  // Which of Salla's two files the merchant came here for. `null` until they
  // choose — products and quantities are different jobs, not different tabs.
  const [mode, setMode] = useState<Mode | null>(null)
  const [showScraperHint, setShowScraperHint] = useState(true)

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

  const step: 1 | 2 | 3 = !workbook ? 1 : activeStep

  function handleLoaded(wb: SourceWorkbook) {
    const first = wb.sheets[0]
    setWorkbook(wb)
    setSheetName(first.name)
    setConfig(autoMap(first))
    setRowOverrides({})
    setExcludedRows(new Set())
    setOptionOverrides({})
    setActiveStep(2)
  }

  /**
   * Reopen a saved sheet with the mapping it was exported under — the point of
   * saving one is not having to configure it again. Manual per-row edits are
   * dropped: they were keyed to the row indices of whatever file was open.
   */
  function handleLoadHistory(item: HistoryItem) {
    if (item.sheet) {
      setWorkbook({ fileName: item.name, sheets: [item.sheet] })
      setSheetName(item.sheet.name)
    } else if (item.sheetName && workbook) {
      const found = workbook.sheets.find((s) => s.name === item.sheetName)
      if (found) setSheetName(item.sheetName)
    }
    setRowOverrides({})
    setExcludedRows(new Set())
    setOptionOverrides({})
    handleConfigChange(item.config)
    setShowSidebar(false)
    setActiveStep(2)
    scrollToTool()
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
    setActiveStep(2)
  }

  function handleReset() {
    setWorkbook(null)
    setSheetName('')
    setConfig(null)
    setRowOverrides({})
    setExcludedRows(new Set())
    setOptionOverrides({})
    setActiveStep(1)
  }

  /**
   * Take the galleries fetched from the product pages. They land in
   * `rowOverrides` — the same channel as a manual image edit — so the fetched
   * list beats whatever the mapping produced (usually nothing, or the product
   * PAGE link a scraper dropped in the image column) and stays editable from
   * the output preview afterwards.
   */
  function handleFillImages(images: Record<number, string>) {
    setRowOverrides((prev) => {
      const next = { ...prev }
      for (const [index, value] of Object.entries(images)) {
        const i = Number(index)
        next[i] = { ...next[i], [F.image]: value }
      }
      return next
    })
  }

  /**
   * Rows that already carry an image edit. The scraper needs this to know what
   * it has done: a fetched gallery lands in `rowOverrides`, not in the sheet,
   * so without it "products with no images" would never shrink and a second
   * run would re-fetch every page.
   */
  const filledImageRows = useMemo(
    () =>
      new Set(
        Object.entries(rowOverrides)
          .filter(([, edits]) => (edits[F.image] ?? '').trim())
          .map(([index]) => Number(index)),
      ),
    [rowOverrides],
  )

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
  const outputRef = useRef<HTMLDivElement>(null)
  function scrollToTool() {
    toolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleConfigChange(next: MappingConfig) {
    setConfig(next)
  }

  function handleFinishMapping() {
    setQuickViewOpen(false)
    setActiveStep(3)
    requestAnimationFrame(() => scrollToTool())
  }

  /**
   * Put a sheet straight into the saved library, without walking the whole
   * upload → map → export flow. It is stored with an auto-mapping so
   * "open for editing" lands you in step 2 ready to go.
   */
  async function handleImportSheet(file: File) {
    const wb = await readWorkbook(file)
    const first = wb.sheets[0]
    if (!first) throw new Error('no sheets in file')
    setHistory(saveHistory(wb.fileName || file.name, autoMap(first), first.name, first))
  }

  /** Step 3's download button only opens the question — the export runs on the answer. */
  function handleExport() {
    if (!validation?.ok) return
    setExportPrompt(true)
  }

  function runExport(save: boolean, name: string) {
    setExportPrompt(false)
    if (save && config && workbook) {
      // Store the sheet snapshot next to the mapping so the entry stays
      // downloadable after a page reload (when no workbook is open).
      const currentSheet = workbook.sheets.find((s) => s.name === sheetName)
      setHistory(saveHistory(name, config, sheetName, currentSheet))
    }

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
        <div className="mx-auto flex max-w-[80rem] items-center justify-between gap-4 px-6 py-3">
          <Logo />
            <div className="flex shrink-0 items-center gap-2">
            {/* Saved sheets live in the header, not on a floating blob — it is
                navigation, and the export count belongs where you can see it. */}
            <button
              type="button"
              onClick={() => setShowSidebar(true)}
              title={t('sidebar.open')}
              aria-label={t('sidebar.open')}
              className="hard-2 lift flex items-center gap-2 bg-white px-3 py-1.5 font-bold text-[color:var(--ink)]"
              style={{ borderRadius: 'var(--r-pill)', fontSize: 'var(--fs-label)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" className="size-4" aria-hidden="true">
                <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h4l2 2.5h7A1.5 1.5 0 0 1 20 10v7.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z" strokeLinejoin="round" />
              </svg>
              <span className="hidden sm:inline">{t('history.title')}</span>
              {history.length > 0 && (
                <span
                  className="inline-flex min-w-5 items-center justify-center bg-[color:var(--violet)] px-1.5 text-[color:var(--on-violet)]"
                  style={{ borderRadius: 'var(--r-pill)', fontSize: '11px' }}
                >
                  {history.length}
                </span>
              )}
            </button>

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

      <div className="mx-auto max-w-[80rem] px-6 py-6">
        {/* The landing only exists before a file is loaded — once you are
            mapping, it would just be noise between you and your data. */}
        {!workbook && <Landing onStart={scrollToTool} />}

        {/* Which of Salla's two files are we here for? The products flow below
            is the original one, unchanged — only gated behind the choice. */}
        <div ref={toolRef}>
          {mode === null && <ModeSelector onPick={setMode} />}
          {mode === 'quantities' && <QuantitiesStandalone onBack={() => setMode(null)} />}
        </div>

        {mode === 'products' && (
          <>
        <div className="mb-4 flex justify-end">
          <Button variant="ghost" onClick={() => setMode(null)}>
            {t('mode.back')}
          </Button>
        </div>

        {/* One dismissible line for Salla scraping tip */}
        {platform === 'salla' && showScraperHint && (
          <div
            className="mb-5 flex items-start gap-2 text-[color:var(--ink)]/65"
            style={{ fontSize: 'var(--fs-label)' }}
          >
            <span aria-hidden>💡</span>
            <p className="flex-1">{t('hint.scraper.body')}</p>
            <button
              type="button"
              onClick={() => setShowScraperHint(false)}
              aria-label={t('hint.dismiss')}
              className="font-extrabold text-[color:var(--ink)]/40 transition hover:text-[color:var(--ink)]"
            >
              ×
            </button>
          </div>
        )}

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
              <Stepper
                current={step}
                onStepClick={(targetStep) => {
                  if (targetStep === 1) {
                    setActiveStep(1)
                    scrollToTool()
                  } else if (targetStep === 2) {
                    if (workbook) setActiveStep(2)
                  } else if (targetStep === 3) {
                    if (workbook && sheet && config) {
                      setActiveStep(3)
                    }
                  }
                }}
              />
            </div>

            <div className="space-y-6">
              {/* Step 1: Upload / Source inspect */}
              {step === 1 && (
                <>
                  {!workbook ? (
                    <>
                      <Card title={t('step1.uploadTitle')} subtitle={t('step1.uploadSubtitle')}>
                        <Uploader onLoaded={handleLoaded} />
                      </Card>
                      <SavedSheets saved={history} onPick={handleLoadHistory} />
                    </>
                  ) : (
                    <Card title={t('step1.sourceTitle')} subtitle={workbook.fileName}>
                      {sheet && (
                        <SourcePreview
                          workbook={workbook}
                          sheet={sheet}
                          onPickSheet={handlePickSheet}
                        />
                      )}
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--ink)]/10 pt-4">
                        <Button variant="ghost" onClick={handleReset}>
                          {t('btn.uploadAnother')}
                        </Button>
                        <Button onClick={() => setActiveStep(2)}>
                          {t('step.nextToMapping')}
                        </Button>
                      </div>
                    </Card>
                  )}
                </>
              )}

              {/* Step 2: Map */}
              {step === 2 && workbook && sheet && config && (
                <>
                  {/* Compact active file summary */}
                  <div className="hard-2 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📄</span>
                      <div>
                        <p className="text-xs font-bold text-[color:var(--ink)]/60">
                          {t('step.activeFile')}
                        </p>
                        <p className="text-sm font-black text-[color:var(--ink)]">
                          {workbook.fileName}
                        </p>
                      </div>
                      <span className="rounded-full bg-[color:var(--cream)] px-2.5 py-0.5 text-xs font-bold border border-[color:var(--ink)]/20">
                        {sheetName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setActiveStep(1)}
                        className="!py-1 !px-2.5 text-xs"
                      >
                        {t('step.backToSource')}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setShowCategories((v) => !v)}
                        className="!py-1 !px-2.5 text-xs"
                      >
                        {showCategories ? '▲ ' : '▼ '} {t('categories.collapsibleTitle')}
                      </Button>
                    </div>
                  </div>

                  {showCategories && (
                    <Card
                      title={t('categories.title')}
                      subtitle={t('categories.collapsibleSubtitle')}
                    >
                      <CategoriesManager
                        categories={storeCategories}
                        onChange={handleCategoriesChange}
                      />
                    </Card>
                  )}

                  <MappingPanel
                    sheet={sheet}
                    config={config}
                    platform={platform}
                    onChange={handleConfigChange}
                    filledImageRows={filledImageRows}
                    onFillImages={handleFillImages}
                    onFinish={handleFinishMapping}
                  />
                </>
              )}

              {/* Step 3: Preview + validate + export */}
              {step === 3 && workbook && sheet && config && validation && (
                <div ref={outputRef} className="space-y-6">
                  <div className="flex items-center justify-between gap-3">
                    <Button variant="ghost" onClick={() => setActiveStep(2)}>
                      {t('step.backToMapping')}
                    </Button>
                    <span className="font-bold text-xs text-[color:var(--ink)]/60">
                      {workbook.fileName} · {sheetName}
                    </span>
                  </div>

                  <div className="my-2">
                    <StepTips tips={[t('tips.done.1'), t('tips.done.2'), t('tips.done.3')]} />
                  </div>

                  {platform === 'salla' && build ? (
                    <Card title={t('preview.title')}>
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
                        <span className="text-sm text-red-600 font-bold">{t('validate.fixErrors')}</span>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </>
        )}
          </>
        )}

          {/* Global Sidebar (opened from the header) */}
          {showSidebar && (
            <Sidebar
              history={history}
              onLoadHistory={handleLoadHistory}
              onDownloadHistory={(item) => {
                const snapshot =
                  item.sheet ?? workbook?.sheets.find((s) => s.name === (item.sheetName ?? sheetName))
                if (!snapshot) return
                // Rebuild from the entry's own mapping only — the manual edits in
                // state belong to the file open right now, not to this export.
                if (platform === 'salla') {
                  const b = buildRows(snapshot, item.config, {}, new Set<number>(), {})
                  if (!b) return
                  downloadWorkbook(buildSallaWorkbook(b.rows), `${item.name || 'export'}-history.xlsx`)
                } else {
                  const prods = buildProducts(snapshot, item.config, {}, new Set<number>())
                  if (!adapter || !prods) return
                  downloadWorkbook(adapter.serialize(prods), adapter.fileName)
                }
              }}
              onImportSheet={handleImportSheet}
              onDeleteHistory={(id) => setHistory(deleteHistory(id))}
              onClearHistory={() => {
                clearHistory()
                setHistory([])
              }}
              onClose={() => setShowSidebar(false)}
            />
          )}

        {workbook && sheet && config && validation && step === 2 && (
          <button
            type="button"
            onClick={() => setQuickViewOpen(true)}
            title={t('preview.quickView')}
            aria-label={t('preview.quickView')}
            className="fixed end-4 top-1/2 z-30 -translate-y-1/2 hard-3 lift bg-[color:var(--violet)] p-3 text-[color:var(--on-violet)]"
            style={{ borderRadius: 'var(--r-pill)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" className="size-6" aria-hidden="true">
              <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
              <circle cx="12" cy="12" r="2.75" />
            </svg>
          </button>
        )}

        {exportPrompt && (
          <ExportSaveDialog
            defaultName={workbook?.fileName || 'export'}
            onConfirm={runExport}
            onClose={() => setExportPrompt(false)}
          />
        )}

        {quickViewOpen && workbook && sheet && config && validation && (
          <Modal title={t('preview.title')} onClose={() => setQuickViewOpen(false)}>
            {platform === 'salla' && build ? (
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
            ) : products ? (
              <ZidPreview
                products={products}
                categories={storeCategories}
                excludedCount={excludedRows.size}
                onEditField={handleEditField}
                onApplyCategoryToAll={handleApplyCategoryToAll}
                onDeleteItem={handleDeleteItem}
                onRestoreAll={handleRestoreAll}
              />
            ) : null}
          </Modal>
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
        {/* Global Toast Notifications */}
        <ToastContainer />
      </div>
    </div>
  )
}
