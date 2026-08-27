import { useRef, useState } from 'react'
import { Button, Card } from '../../../components/ui'
import { useI18n } from '../../../lib/i18n'
import { readWorkbook } from '../../../lib/reader'
import { buildProducts } from '../../../lib/product'
import { autoMap } from '../../../lib/automap'
import QuantitiesPreviewTable from './QuantitiesPreviewTable'
import { NotAQuantitiesSheet, readQuantitiesFile } from '../parseSallaQuantities'
import { mergeWithSalla } from '../mergeWithSalla'
import { downloadQuantities } from '../exportQuantitiesXlsx'
import { LIMITED, ROW_PRODUCT, type MergeReport, type QuantityRow } from '../types'

/**
 * The trustworthy path: start from the file Salla itself produced.
 *
 * That file is the only place the `No.` ids exist, so everything here is built
 * around not losing them — the merchant edits quantities, and every other cell
 * (id, name, SKU, row order) is handed back exactly as it arrived.
 */
export default function QuantitiesStandalone({ onBack }: { onBack: () => void }) {
  const { t } = useI18n()
  const [rows, setRows] = useState<QuantityRow[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [report, setReport] = useState<MergeReport | null>(null)
  const [error, setError] = useState('')
  const sallaInput = useRef<HTMLInputElement>(null)
  const sourceInput = useRef<HTMLInputElement>(null)

  async function loadSalla(file: File) {
    setError('')
    try {
      const parsed = await readQuantitiesFile(file)
      if (!parsed.length) return setError(t('qty.emptyFile'))
      setRows(parsed)
      setFileName(file.name)
      setReport(null)
    } catch (err) {
      setError(err instanceof NotAQuantitiesSheet ? t('qty.wrongFile') : t('qty.readFailed'))
    }
  }

  /**
   * Optional second upload: the merchant's own products sheet, used purely as
   * a source of numbers. It can never add rows — a row Salla does not have has
   * no id, so it could not be imported anyway.
   */
  async function loadSource(file: File) {
    if (!rows) return
    setError('')
    try {
      const wb = await readWorkbook(file)
      const sheet = wb.sheets[0]
      if (!sheet) return setError(t('qty.readFailed'))

      const products = buildProducts(sheet, autoMap(sheet), {}, new Set<number>())
      const incoming: QuantityRow[] = products.map((p) => ({
        no: '',
        type: ROW_PRODUCT,
        name: p.nameAr || p.nameEn,
        sku: p.sku,
        unlimited: LIMITED,
        quantity: p.quantity === '' ? '' : Number(p.quantity),
      }))

      const merged = mergeWithSalla(rows, incoming)
      setRows(merged.rows)
      setReport(merged.report)
    } catch {
      setError(t('qty.readFailed'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2
          className="font-extrabold text-[color:var(--ink)]"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-section)' }}
        >
          {t('mode.quantities.title')}
        </h2>
        <Button variant="ghost" onClick={onBack}>
          {t('mode.back')}
        </Button>
      </div>

      {!rows ? (
        <Card title={t('qty.uploadTitle')} subtitle={t('qty.uploadSubtitle')}>
          <input
            ref={sallaInput}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void loadSalla(file)
              e.target.value = ''
            }}
          />
          <Button onClick={() => sallaInput.current?.click()}>{t('qty.pickFile')}</Button>
          {error && <p className="mt-3 font-bold text-red-600" style={{ fontSize: 'var(--fs-label)' }}>{error}</p>}
        </Card>
      ) : (
        <>
          <Card title={t('qty.editTitle')} subtitle={fileName}>
            {/* Inline, not a popup: it is a standing limit of this path, not
                an error the merchant just caused. */}
            <div
              className="mb-4 card p-3"
              style={{ borderColor: 'var(--ink)', background: 'var(--mustard)' }}
            >
              <p className="text-[color:var(--ink)]" style={{ fontSize: 'var(--fs-label)' }}>
                {t('qty.noNewOptions')}
              </p>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <input
                ref={sourceInput}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void loadSource(file)
                  e.target.value = ''
                }}
              />
              <Button variant="secondary" onClick={() => sourceInput.current?.click()}>
                {t('qty.fillFromSheet')}
              </Button>
              <span className="text-[color:var(--ink)]/60" style={{ fontSize: 'var(--fs-label)' }}>
                {t('qty.fillFromSheetHint')}
              </span>
            </div>

            {report && <MergeSummary report={report} />}
            {error && <p className="mb-3 font-bold text-red-600" style={{ fontSize: 'var(--fs-label)' }}>{error}</p>}

            <QuantitiesPreviewTable rows={rows} onChange={setRows} />

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t-2 border-[color:var(--ink)]/15 pt-4">
              <Button onClick={() => void downloadQuantities(rows, fileName || 'salla-quantities.xlsx')}>
                {t('qty.download')}
              </Button>
              <Button variant="ghost" onClick={() => { setRows(null); setReport(null) }}>
                {t('qty.anotherFile')}
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function MergeSummary({ report }: { report: MergeReport }) {
  const { t } = useI18n()
  return (
    <div className="mb-4 card p-3" style={{ borderColor: 'var(--ink)' }}>
      <p className="font-bold text-[color:var(--ink)]" style={{ fontSize: 'var(--fs-label)' }}>
        {t('qty.merge.matched', { n: report.matched })}
      </p>
      {report.unmatched.length > 0 && (
        <p className="mt-1 text-[color:var(--ink)]/70" style={{ fontSize: 'var(--fs-label)' }}>
          {t('qty.merge.unmatched', { n: report.unmatched.length })}
        </p>
      )}
      {report.missingInStore.length > 0 && (
        <details className="mt-2">
          <summary
            className="cursor-pointer font-bold text-[color:var(--ink)]"
            style={{ fontSize: 'var(--fs-label)' }}
          >
            {t('qty.merge.missing', { n: report.missingInStore.length })}
          </summary>
          <ul className="mt-1 space-y-0.5">
            {report.missingInStore.slice(0, 20).map((name) => (
              <li key={name} className="text-[color:var(--ink)]/70" style={{ fontSize: 'var(--fs-label)' }}>
                {name}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
