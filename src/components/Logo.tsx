/**
 * Muzawwid (مزوّد — "supplier") brand mark.
 * Editorial spec: a 32px rounded square, black text/glyph on white background.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center transition-transform duration-300 hover:scale-105"
      style={{
        width: size,
        height: size,
        borderRadius: '8px',
        // Set here, not via `bg-white`: tokens.css rewrites that utility to a
        // #111111 dark surface, which left the #050505 glyph invisible.
        background: '#FFFFFF',
        color: '#050505',
        boxShadow: '0 2px 8px rgba(255, 255, 255, 0.1)',
      }}
      aria-hidden="true"
    >
      <svg
        width={Math.round(size * 0.62)}
        height={Math.round(size * 0.62)}
        viewBox="0 0 24 24"
        fill="#050505"
      >
        {/* منتج — the parent row, full width */}
        <rect x="2" y="2.5" width="20" height="4.4" rx="2.2" />
        {/* the spine the variants branch off (trailing side) */}
        <rect x="16.6" y="6.9" width="2.2" height="13.2" rx="1.1" />
        {/* خيار — two variant rows, each meeting the spine */}
        <rect x="5.5" y="10.6" width="13.3" height="3.8" rx="1.9" />
        <rect x="5.5" y="16.8" width="13.3" height="3.8" rx="1.9" />
      </svg>
    </span>
  )
}

/** Full lockup: mark + bilingual wordmark in Midnight Editorial style. */
export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={32} />
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className="font-black text-[#EBEBEB] text-lg sm:text-xl tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            مزوّد
          </span>
          <span className="size-1.5 rounded-full bg-[#FF6B50]" />
        </div>
        <div
          dir="ltr"
          className="font-bold text-[#888888] text-[10px] tracking-[0.2em] -mt-0.5"
        >
          MUZAWWID
        </div>
      </div>
    </div>
  )
}
