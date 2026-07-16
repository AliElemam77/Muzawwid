import { useI18n } from '../lib/i18n'
import { LINKS } from '../lib/links'

/**
 * "by Ali Elemam" — the individual author credit, linking to his LinkedIn.
 * Distinct from `MadeBy` (the company): this names the person, that names the
 * firm. Rendered LTR since the name and handle are Latin.
 */
const AUTHOR = 'Ali Elemam'

function LinkedinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  )
}

export default function AuthorCredit() {
  const { t } = useI18n()

  const link =
    'lift inline-flex items-center gap-1.5 border-2 px-2.5 py-1 font-bold text-[color:var(--ink)]'
  const linkStyle = {
    borderRadius: 'var(--r-pill)',
    borderColor: 'var(--ink)',
    background: 'var(--white)',
    boxShadow: 'calc(3px * var(--sh-dir)) 3px 0 var(--ink)',
    fontSize: 'var(--fs-label)',
  } as const

  return (
    <div dir="ltr" className="inline-flex flex-wrap items-center justify-center gap-2.5">
      <span className="font-bold text-[color:var(--ink)]/70" style={{ fontSize: 'var(--fs-label)' }}>
        {t('author.by')} <span className="text-[color:var(--ink)]">{AUTHOR}</span>
      </span>
      <a href={LINKS.linkedin} target="_blank" rel="noreferrer" className={link} style={linkStyle}>
        <LinkedinIcon />
        LinkedIn
      </a>
    </div>
  )
}
