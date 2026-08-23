import { useRef, useState } from 'react'
import { readWorkbook, type SourceWorkbook } from '../lib/reader'
import { createSampleWorkbook } from '../lib/sampleSheet'
import { showToast } from './Toast'
import { useI18n } from '../lib/i18n'
import StepTips from './StepTips'
import { Button } from './ui'

/** Drag & drop / file-picker for .xlsx/.xls/.csv → parsed SourceWorkbook. */
export default function Uploader({
  onLoaded,
}: {
  onLoaded: (wb: SourceWorkbook) => void
}) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError('')
    setBusy(true)
    try {
      const wb = await readWorkbook(file)
      if (wb.sheets.length === 0) {
        setError(t('uploader.errNoData'))
        return
      }
      onLoaded(wb)
    } catch {
      setError(t('uploader.errRead'))
    } finally {
      setBusy(false)
    }
  }

  function handleLoadDemo() {
    const demoWb = createSampleWorkbook()
    onLoaded(demoWb)
    showToast(t('toast.demoLoaded'), 'success')
  }

  return (
    <div>
      <div className="mb-4">
        <StepTips tips={[t('tips.upload.1'), t('tips.upload.2'), t('tips.upload.3')]} />
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFile(e.dataTransfer.files[0])
        }}
        className={
          'hard-3 lift flex cursor-pointer flex-col items-center justify-center gap-3.5 p-10 text-center transition-all ' +
          (dragging
            ? 'bg-[color:var(--warning-tint)] border-[color:var(--ink)] scale-[1.01]'
            : 'bg-white hover:bg-[color:var(--cream)]/40')
        }
        style={{
          borderRadius: 'var(--r-drop)',
          borderStyle: dragging ? 'dashed' : 'solid',
        }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--mustard)] border-2 border-[color:var(--ink)] text-3xl shadow-sm">
          📂
        </div>
        <div>
          <p className="text-lg font-black text-[color:var(--ink)]">
            {busy ? t('uploader.busy') : t('uploader.cta')}
          </p>
          <p className="mt-1 text-sm font-medium text-[color:var(--ink)]/65">
            {t('uploader.formats')}
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {error && (
        <div className="mt-3 rounded-lg border-2 border-[color:var(--coral)] bg-[color:var(--error-tint)] p-3 text-sm font-bold text-[color:var(--ink)]">
          ⚠️ {error}
        </div>
      )}

      <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <span className="text-xs font-bold text-[color:var(--ink)]/60">
          {t('uploader.demo')}
        </span>
        <Button
          type="button"
          variant="secondary"
          onClick={handleLoadDemo}
          className="!py-1.5 !px-3 text-xs"
        >
          {t('uploader.demoBtn')}
        </Button>
      </div>
    </div>
  )
}
