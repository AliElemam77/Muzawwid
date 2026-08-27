import { useRef, useState } from 'react'
import type { HistoryItem } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { relativeTime } from '../lib/time'
import { Button } from './ui'

/**
 * The saved-sheets library.
 *
 * Each entry used to be a card with a title, a full timestamp, a row of pills
 * and three full-size buttons — so four saved sheets filled the drawer. Now an
 * entry is one line: name, a short meta line, and icon actions that sit at the
 * end of it.
 */
export default function RecentExports({
  history,
  onLoad,
  onDownload,
  onDelete,
  onClear,
  onImport,
}: {
  history: HistoryItem[]
  onLoad: (item: HistoryItem) => void
  onDownload: (item: HistoryItem) => void
  onDelete: (id: string) => void
  onClear: () => void
  /** Reads a file off the device straight into the library. Rejects on a bad file. */
  onImport: (file: File) => Promise<void>
}) {
  const { t, lang } = useI18n()
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [importError, setImportError] = useState('')

  const locale = lang === 'ar' ? 'ar-EG' : 'en-GB'

  async function handleImport(file: File | undefined) {
    if (!file || busy) return
    setImportError('')
    setBusy(true)
    try {
      await onImport(file)
    } catch {
      setImportError(t('uploader.errRead'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Add a sheet without walking the whole map → export flow. */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          void handleImport(e.dataTransfer.files[0])
        }}
        className={`hard-2 lift w-full cursor-pointer px-4 py-3 font-extrabold text-(--ink) ${
          dragging ? 'bg-(--mustard)' : 'bg-white'
        }`}
        style={{ borderRadius: 'var(--r-card)', fontSize: 'var(--fs-body)' }}
      >
        {busy ? t('history.importBusy') : `＋ ${t('history.import')}`}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          void handleImport(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {importError && (
        <p className="font-bold text-(--error)" style={{ fontSize: 'var(--fs-label)' }}>
          {importError}
        </p>
      )}

      {history.length === 0 ? (
        <p
          className="px-1 py-6 text-center text-(--ink)/55"
          style={{ fontSize: 'var(--fs-label)' }}
        >
          {t('history.empty')}
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-(--ink)/55" style={{ fontSize: 'var(--fs-label)' }}>
              {t('history.count', { n: history.length })}
            </span>
            {confirmingClear ? (
              <span className="flex items-center gap-1">
                <Button
                  variant="danger"
                  onClick={() => {
                    onClear()
                    setConfirmingClear(false)
                  }}
                >
                  {t('history.confirmClear')}
                </Button>
                <Button variant="ghost" onClick={() => setConfirmingClear(false)}>
                  {t('btn.cancel')}
                </Button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="font-bold text-(--ink)/45 underline-offset-2 transition hover:text-(--error) hover:underline"
                style={{ fontSize: 'var(--fs-label)' }}
              >
                {t('history.clear')}
              </button>
            )}
          </div>

          <ul className="space-y-2">
            {history.map((item) => (
              <Entry
                key={item.id}
                item={item}
                locale={locale}
                armed={confirming === item.id}
                onArm={() => setConfirming(item.id)}
                onDisarm={() => setConfirming(null)}
                onLoad={() => onLoad(item)}
                onDownload={() => onDownload(item)}
                onDelete={() => {
                  onDelete(item.id)
                  setConfirming(null)
                }}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function Entry({
  item,
  locale,
  armed,
  onArm,
  onDisarm,
  onLoad,
  onDownload,
  onDelete,
}: {
  item: HistoryItem
  locale: string
  armed: boolean
  onArm: () => void
  onDisarm: () => void
  onLoad: () => void
  onDownload: () => void
  onDelete: () => void
}) {
  const { t } = useI18n()
  // Without a stored sheet snapshot there is nothing to rebuild the file from.
  const restorable = Boolean(item.sheet)
  const rows = item.sheet?.rows.length ?? 0

  // Name · when · how big · which tab — one line instead of a stack of pills.
  const meta = [
    relativeTime(item.ts, locale),
    rows > 0 ? t('history.rows', { n: rows }) : '',
    item.sheetName,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <li className="hard-2 bg-white px-3 py-2.5" style={{ borderRadius: 'var(--r-card)' }}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onLoad}
          className="min-w-0 flex-1 text-start"
          title={t('history.load')}
        >
          <span
            className="block truncate font-extrabold text-(--ink)"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-body)' }}
          >
            {item.name}
          </span>
          <span
            className="mt-0.5 block truncate text-(--ink)/55"
            style={{ fontSize: 'var(--fs-label)' }}
          >
            {meta}
          </span>
        </button>

        {!armed && (
          <div className="flex shrink-0 items-center gap-1">
            <IconButton label={t('history.download')} onClick={onDownload} disabled={!restorable}>
              ⬇
            </IconButton>
            <IconButton label={t('btn.delete')} onClick={onArm} danger>
              ✕
            </IconButton>
          </div>
        )}
      </div>

      {armed && (
        <div className="mt-2 flex items-center gap-2">
          <Button variant="danger" onClick={onDelete}>
            {t('history.confirmDelete')}
          </Button>
          <Button variant="ghost" onClick={onDisarm}>
            {t('btn.cancel')}
          </Button>
        </div>
      )}
    </li>
  )
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: string
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center border-2 border-(--ink) bg-white font-extrabold text-(--ink) transition disabled:cursor-not-allowed disabled:border-transparent disabled:text-(--ink)/25 ${
        danger ? 'hover:bg-(--error) hover:text-white' : 'hover:bg-(--teal)'
      }`}
      style={{ borderRadius: 'var(--r-pill)', fontSize: 'var(--fs-label)' }}
    >
      {children}
    </button>
  )
}

