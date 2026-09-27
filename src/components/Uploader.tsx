import { useRef, useState } from 'react'
import { UploadCloud, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { readWorkbook, type SourceWorkbook } from '../lib/reader'
import { useI18n } from '../lib/i18n'
import StepTips from './StepTips'

/** Drag & drop / file-picker for .xlsx/.xls/.csv → parsed SourceWorkbook. */
export default function Uploader({
  onLoaded,
  showTips = true,
  compact = false,
}: {
  onLoaded: (wb: SourceWorkbook) => void
  showTips?: boolean
  compact?: boolean
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

  return (
    <div>
      {showTips && (
        <div className="mb-4">
          <StepTips tips={[t('tips.upload.1'), t('tips.upload.2'), t('tips.upload.3')]} />
        </div>
      )}

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
          'group flex cursor-pointer flex-col items-center justify-center text-center transition-all duration-300 ' +
          (compact ? 'gap-3 p-6 sm:p-7 ' : 'gap-4 p-8 sm:p-10 ') +
          (dragging
            ? 'border-2 border-dashed border-[#FF6B50] bg-[#FF6B50]/10 scale-[1.01]'
            : 'border border-dashed border-white/15 bg-[#161616] hover:border-[#FF6B50]/60 hover:bg-[#1A1A1A]')
        }
        style={{
          borderRadius: '1.25rem',
        }}
      >
        <div
          className={
            'flex items-center justify-center rounded-2xl border border-[#FF6B50]/30 bg-[#FF6B50]/10 shadow-sm transition-transform duration-300 group-hover:scale-110 ' +
            (compact ? 'h-12 w-12 text-[#FF6B50]' : 'h-14 w-14 text-[#FF6B50]')
          }
        >
          {dragging ? (
            <FileSpreadsheet className="size-6 text-[#FF6B50] animate-bounce" />
          ) : (
            <UploadCloud className="size-7 text-[#FF6B50]" />
          )}
        </div>

        <div>
          <p className="text-base sm:text-lg font-black text-[#EBEBEB] tracking-tight">
            {busy ? t('uploader.busy') : t('uploader.cta')}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            {['.xlsx', '.xls', '.csv'].map((fmt) => (
              <span
                key={fmt}
                dir="ltr"
                className="rounded-md border border-white/10 bg-[#111111] px-2 py-0.5 text-[11px] font-bold text-[#D4D4D4]"
              >
                {fmt}
              </span>
            ))}
          </div>
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
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#FF6B50]/30 bg-[#FF6B50]/10 p-3 text-xs sm:text-sm font-bold text-[#FF6B50]">
          <AlertCircle className="size-4 shrink-0 text-[#FF6B50]" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
