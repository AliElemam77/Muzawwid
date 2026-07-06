import { useMemo, useState } from 'react'
import type { SourceWorkbook } from './lib/reader'
import type { MappingConfig, Preset } from './lib/types'
import { autoMap } from './lib/automap'
import { buildRows, validate, type RowOverrides } from './lib/build'
import { F } from './lib/salla'
import { buildSallaWorkbook, downloadWorkbook } from './lib/salla'
import { loadPresets, savePreset, deletePreset } from './lib/presets'
import { loadCategories, saveCategories } from './lib/categories'

import Stepper from './components/Stepper'
import Uploader from './components/Uploader'
import SourcePreview from './components/SourcePreview'
import MappingPanel from './components/MappingPanel'
import CategoriesManager from './components/CategoriesManager'
import OutputPreview from './components/OutputPreview'
import ValidationSummary from './components/ValidationSummary'
import PresetBar from './components/PresetBar'
import { Card, Button } from './components/ui'

export default function App() {
  const [workbook, setWorkbook] = useState<SourceWorkbook | null>(null)
  const [sheetName, setSheetName] = useState('')
  const [config, setConfig] = useState<MappingConfig | null>(null)
  const [presets, setPresets] = useState<Preset[]>(() => loadPresets())
  // Manual per-product edits (name / price / category), keyed by source row index.
  const [rowOverrides, setRowOverrides] = useState<RowOverrides>({})
  // Items (source rows) the user removed from the export.
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set())
  // The store's category list — persisted across files, chosen from per product.
  const [storeCategories, setStoreCategories] = useState<string[]>(() => loadCategories())

  const sheet = useMemo(
    () => workbook?.sheets.find((s) => s.name === sheetName) ?? null,
    [workbook, sheetName],
  )

  // Rebuild output + validation whenever the sheet, mapping, or edits change.
  const build = useMemo(
    () =>
      sheet && config
        ? buildRows(sheet, config, rowOverrides, excludedRows)
        : null,
    [sheet, config, rowOverrides, excludedRows],
  )
  const validation = useMemo(
    () => (build ? validate(build.rows) : null),
    [build],
  )

  const step: 1 | 2 | 3 = !workbook ? 1 : validation?.ok ? 3 : 2

  function handleLoaded(wb: SourceWorkbook) {
    const first = wb.sheets[0]
    setWorkbook(wb)
    setSheetName(first.name)
    setConfig(autoMap(first.headers))
    setRowOverrides({})
    setExcludedRows(new Set())
  }

  function handlePickSheet(name: string) {
    const s = workbook?.sheets.find((x) => x.name === name)
    if (!s) return
    setSheetName(name)
    // Re-run auto-mapping for the newly selected sheet's headers.
    setConfig(autoMap(s.headers))
    // Row indices no longer correspond to the previous sheet — clear edits.
    setRowOverrides({})
    setExcludedRows(new Set())
  }

  function handleReset() {
    setWorkbook(null)
    setSheetName('')
    setConfig(null)
    setRowOverrides({})
    setExcludedRows(new Set())
  }

  function handleEditField(sourceIndex: number, field: string, value: string) {
    setRowOverrides((prev) => ({
      ...prev,
      [sourceIndex]: { ...prev[sourceIndex], [field]: value },
    }))
  }

  function handleApplyCategoryToAll(value: string) {
    if (!build) return
    setRowOverrides((prev) => {
      const next = { ...prev }
      for (const m of build.meta) {
        if (m.isProduct) {
          next[m.sourceIndex] = { ...next[m.sourceIndex], [F.category]: value }
        }
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

  function handleRestoreAll() {
    setExcludedRows(new Set())
  }

  function handleExport() {
    if (!build || !validation?.ok) return
    const wb = buildSallaWorkbook(build.rows)
    downloadWorkbook(wb, 'salla-import.xlsx')
  }

  return (
    <div className="min-h-full">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-2xl font-extrabold text-slate-900">
            محوّل الشيتات إلى صيغة سلة
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            حوّل أي ملف منتجات إلى ملف استيراد جاهز للرفع على سلة — كل المعالجة داخل متصفحك، بدون رفع لأي خادم.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-8">
          <Stepper current={step} />
        </div>

        <div className="space-y-6">
          {/* Step 1: Upload */}
          {!workbook ? (
            <Card title="١) رفع الملف" subtitle="ابدأ برفع ملف المنتجات بصيغة xlsx أو xls أو csv.">
              <Uploader onLoaded={handleLoaded} />
            </Card>
          ) : (
            <Card title="١) الملف المصدر" subtitle={workbook.fileName}>
              {sheet && (
                <SourcePreview
                  workbook={workbook}
                  sheet={sheet}
                  onPickSheet={handlePickSheet}
                />
              )}
              <div className="mt-4">
                <Button variant="ghost" onClick={handleReset}>
                  رفع ملف آخر
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: Map */}
          {workbook && sheet && config && (
            <>
              <Card title="القوالب المحفوظة" subtitle="احفظ إعدادات المطابقة لإعادة استخدامها مع الملفات القادمة.">
                <PresetBar
                  presets={presets}
                  onSave={(name) => setPresets(savePreset(name, config))}
                  onLoad={(c) => setConfig(c)}
                  onDelete={(name) => setPresets(deletePreset(name))}
                />
              </Card>

              <Card title="تصنيفات متجرك" subtitle="عرّف تصنيفات متجرك مرة واحدة لتختار منها لكل منتج في المعاينة — بدل كتابتها يدويًا.">
                <CategoriesManager
                  categories={storeCategories}
                  onChange={handleCategoriesChange}
                />
              </Card>

              <h2 className="pt-2 text-xl font-bold text-slate-900">٢) مطابقة الأعمدة</h2>
              <MappingPanel
                columns={sheet.headers}
                config={config}
                onChange={setConfig}
              />
            </>
          )}

          {/* Step 3: Preview + validate + export */}
          {build && validation && (
            <>
              <h2 className="pt-2 text-xl font-bold text-slate-900">٣) المعاينة والتصدير</h2>
              <Card title="معاينة المخرجات" subtitle="صفوف «منتج» بيضاء وصفوف «خيار» مظلّلة.">
                <OutputPreview
                  rows={build.rows}
                  meta={build.meta}
                  categories={storeCategories}
                  productCount={build.productCount}
                  optionCount={build.optionCount}
                  excludedCount={excludedRows.size}
                  onEditField={handleEditField}
                  onApplyCategoryToAll={handleApplyCategoryToAll}
                  onDeleteItem={handleDeleteItem}
                  onRestoreAll={handleRestoreAll}
                />
              </Card>

              <Card title="التحقق قبل التصدير">
                <ValidationSummary validation={validation} />
                <div className="mt-4 flex items-center gap-3">
                  <Button onClick={handleExport} disabled={!validation.ok}>
                    ⬇ تحميل ملف الاستيراد (.xlsx)
                  </Button>
                  {!validation.ok && (
                    <span className="text-sm text-red-600">
                      صحّح الأخطاء أعلاه لتفعيل التحميل.
                    </span>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>

        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          يُنشئ ورقة واحدة فقط باسم «Salla Products Template Sheet» — جاهزة للرفع على{' '}
          <span dir="ltr">s.salla.sa/import/products</span>
        </footer>
      </div>
    </div>
  )
}
