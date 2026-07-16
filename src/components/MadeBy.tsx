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
 * `tone="dark"` is for placement on the ink-coloured strip.
 */
export default function MadeBy({
  tone = 'light',
  size = 34,
}: {
  tone?: 'light' | 'dark'
  size?: number
}) {
  const dark = tone === 'dark'

  return (
    <a
      href={LINKS.company}
      target="_blank"
      rel="noreferrer"
      className="lift inline-flex items-center gap-2.5 border-2 px-3 py-1.5"
      style={{
        borderRadius: 'var(--r-pill)',
        borderColor: dark ? 'var(--cream)' : 'var(--ink)',
        background: dark ? 'transparent' : 'var(--white)',
        boxShadow: `calc(3px * var(--sh-dir)) 3px 0 ${dark ? 'var(--cream)' : 'var(--ink)'}`,
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
