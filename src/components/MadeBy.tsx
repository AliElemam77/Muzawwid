import apqrinuLogo from '../assets/apqrinu.webp'
import { LINKS } from '../lib/links'

/**
 * "Built at عبقرينو" — the credit for the COMPANY behind the product, linking to
 * its site.
 *
 * Deliberately a separate component from `Logo`: this mark identifies the maker,
 * never the site itself, so the two must not be swappable. The asset is a full
 * lockup (character mark + عبقرينو/APQRINU wordmark), which is why no extra
 * wordmark is rendered next to it.
 *
 * The plate is a REAL white, hard-coded rather than taken from `--white`: that
 * token is a #111111 dark surface here, and the lockup's wordmark is solid
 * black, so it disappeared into the pill entirely. A supplied brand asset
 * cannot be recoloured to suit the theme — the theme gives it the background it
 * was drawn for.
 */
export default function MadeBy({ size = 34 }: { size?: number }) {
  return (
    <a
      href={LINKS.company}
      target="_blank"
      rel="noreferrer"
      className="lift inline-flex items-center gap-2.5 px-3.5 py-2"
      style={{
        borderRadius: 'var(--r-pill)',
        background: '#FFFFFF',
        boxShadow: '0 6px 18px -4px rgba(0, 0, 0, 0.6)',
      }}
    >
      <img
        src={apqrinuLogo}
        alt="عبقرينو — APQRINU"
        height={size}
        style={{ height: size }}
        className="w-auto select-none"
        draggable={false}
      />
    </a>
  )
}
