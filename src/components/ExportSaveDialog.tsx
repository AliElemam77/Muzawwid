import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import Modal from './Modal'
import { Button, TextInput } from './ui'

/** Asked right before the download: keep a copy of this sheet on the device, or just download it. */
export default function ExportSaveDialog({
  defaultName,
  onConfirm,
  onClose,
}: {
  defaultName: string
  /** `name` is only meaningful when `save` is true. */
  onConfirm: (save: boolean, name: string) => void
  onClose: () => void
}) {
  const { t } = useI18n()
  const [name, setName] = useState(defaultName)

  const finalName = name.trim() || defaultName

  return (
    <Modal size="sm" title={t('download.title')} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-[color:var(--ink)]" style={{ fontSize: 'var(--fs-body)' }}>
          {t('download.body')}
        </p>

        <div>
          <label
            className="mb-1 block font-bold text-[color:var(--ink)]"
            style={{ fontSize: 'var(--fs-label)' }}
            htmlFor="export-name"
          >
            {t('download.nameLabel')}
          </label>
          <TextInput
            id="export-name"
            value={name}
            placeholder={defaultName}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onConfirm(true, finalName)
            }}
          />
        </div>

        <p className="text-[color:var(--ink)]/70" style={{ fontSize: 'var(--fs-label)' }}>
          {t('download.localNote')}
        </p>

        <div className="flex flex-wrap items-center gap-2 border-t-2 border-[color:var(--ink)]/15 pt-4">
          <Button onClick={() => onConfirm(true, finalName)}>{t('download.saveAndDownload')}</Button>
          <Button variant="secondary" onClick={() => onConfirm(false, finalName)}>
            {t('download.downloadOnly')}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t('btn.cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
