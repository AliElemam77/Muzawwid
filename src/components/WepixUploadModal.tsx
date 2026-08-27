import { LINKS } from '../lib/links'
import { useI18n } from '../lib/i18n'
import Modal from './Modal'

/**
 * wepix, embedded. Muzawwid never uploads anything itself — turning a local file
 * into a link Salla can fetch needs a host, and wepix (a partner tool) is it.
 * Keeping it in an iframe means the user never loses the mapping they are editing.
 */
export default function WepixUploadModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()

  return (
    <Modal size="md" title={t('wepix.title')} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-(--ink)/75" style={{ fontSize: 'var(--fs-label)' }}>
            {t('wepix.note')}
          </p>
          <a
            href={LINKS.wepixEmbed}
            target="_blank"
            rel="noreferrer"
            className="hard-2 lift bg-white px-3 py-1.5 font-bold text-(--ink)"
            style={{ borderRadius: 'var(--r-pill)', fontSize: 'var(--fs-label)' }}
          >
            {t('wepix.openTab')}
          </a>
        </div>

        <iframe
          src={LINKS.wepixEmbed}
          title={t('wepix.title')}
          className="hard-2 h-[70vh] w-full bg-white"
          style={{ borderRadius: 'var(--r-card)' }}
          allow="clipboard-write; clipboard-read"
        />

        <p className="text-(--ink)/60" style={{ fontSize: 'var(--fs-label)' }}>
          {t('wepix.blocked')}
        </p>
      </div>
    </Modal>
  )
}
