/**
 * Muzawwid (مزوّد — "supplier") brand mark: a stacked-layers glyph inside a
 * rounded indigo badge, evoking supplying/stocking a store. Self-contained SVG.
 */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label="Muzawwid"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="muzawwid-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#muzawwid-g)" />
      {/* top layer (a "supplied" package) */}
      <path d="M20 8 L31 13.5 L20 19 L9 13.5 Z" fill="#fff" />
      {/* two receding layers below */}
      <path
        d="M9 19 L20 24.5 L31 19"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M9 24.5 L20 30 L31 24.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  )
}

/** Full lockup: mark + bilingual wordmark. */
export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={40} />
      <div className="leading-tight">
        <div className="text-lg font-extrabold tracking-tight text-slate-900">
          Muzawwid
        </div>
        <div className="text-xs font-semibold text-indigo-600">مزوّد</div>
      </div>
    </div>
  )
}
