import { useRef, useState } from 'react'
import { readWorkbook, type SourceWorkbook } from '../lib/reader'

/** Drag & drop / file-picker for .xlsx/.xls/.csv → parsed SourceWorkbook. */
export default function Uploader({
  onLoaded,
}: {
  onLoaded: (wb: SourceWorkbook) => void
}) {
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
        setError('لم يتم العثور على أي بيانات في الملف.')
        return
      }
      onLoaded(wb)
    } catch {
      setError('تعذّر قراءة الملف. تأكد أنه بصيغة xlsx أو xls أو csv.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
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
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center transition ' +
          (dragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50')
        }
      >
        <div className="text-4xl">📄</div>
        <p className="text-base font-semibold text-slate-800">
          {busy ? 'جارٍ القراءة…' : 'اسحب ملف الشيت هنا أو اضغط للاختيار'}
        </p>
        <p className="text-sm text-slate-500">يدعم صيغ .xlsx و .xls و .csv — تتم المعالجة داخل متصفحك فقط</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
    </div>
  )
}
