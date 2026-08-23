import { useEffect, useId } from 'react'
import { useI18n } from '../lib/i18n'
import type { HistoryItem } from '../lib/types'
import RecentExports from './RecentExports'

/** Slide-over drawer for the sheets kept on this device: restore, re-download, or drop one. */
export default function Sidebar({
  history,
  onLoadHistory,
  onDownloadHistory,
  onDeleteHistory,
  onClearHistory,
  onImportSheet,
  onClose,
}: {
  history: HistoryItem[]
  onLoadHistory: (item: HistoryItem) => void
  onDownloadHistory: (item: HistoryItem) => void
  onDeleteHistory: (id: string) => void
  onClearHistory: () => void
  onImportSheet: (file: File) => Promise<void>
  onClose: () => void
}) {
  const { t } = useI18n()
  const titleId = useId()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-60 flex justify-end bg-black/45"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex h-full w-full max-w-[28rem] flex-col border-s-[3px] border-(--ink) bg-(--cream)"
      >
        <header className="flex items-center justify-between gap-3 border-b-2 border-(--ink) bg-white px-4 py-3">
          <h2
            id={titleId}
            className="font-extrabold text-(--ink)"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-section)' }}
          >
            {t('history.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('sidebar.close')}
            className="hard-2 lift bg-white px-3 py-1 font-bold text-(--ink)"
            style={{ borderRadius: 'var(--r-pill)', fontSize: 'var(--fs-label)' }}
          >
            ×
          </button>
        </header>

        <div className="scroll-thin flex-1 overflow-auto p-4">
          <RecentExports
            history={history}
            onLoad={onLoadHistory}
            onDownload={onDownloadHistory}
            onDelete={onDeleteHistory}
            onClear={onClearHistory}
            onImport={onImportSheet}
          />
        </div>
      </aside>
    </div>
  )
}
