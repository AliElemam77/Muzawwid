/**
 * Muzawwid (مزوّد — "supplier") brand mark, drawn in the app's OWN system: a
 * flat teal tile wearing the same 3px ink outline and hard offset shadow as
 * every other surface. No gradient — tokens.css forbids them, and the previous
 * mark's indigo gradient was the last one left in the app.
 *
 * The glyph says what the tool does in one picture: a full-width «منتج» bar
 * branching down a spine into two shorter «خيار» bars — literally the parent +
 * variant row structure `buildRows` writes into the Salla sheet. The spine is
 * load-bearing, not decoration: three plain stacked bars read as a hamburger
 * MENU icon, and the branch is what makes it a hierarchy instead. It sits on
 * the trailing side, so the tree grows right-to-left like the Arabic UI.
 *
 * The tile is a DIV, not an SVG rect, so the hard shadow comes from `hard-2`
 * and flips automatically with --sh-dir in RTL.
 */
export function LogoMark({ size = 42 }: { size?: number }) {
  return (
    <span
      className="hard-2 flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
        background: 'var(--teal)',
      }}
      aria-hidden="true"
    >
      <svg
        width={Math.round(size * 0.6)}
        height={Math.round(size * 0.6)}
        viewBox="0 0 24 24"
        fill="var(--ink)"
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

/** Full lockup: mark + bilingual wordmark. */
export default function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={42} />
      <div className="leading-none">
        <div
          className="font-extrabold text-[color:var(--ink)]"
          style={{ fontFamily: 'var(--font-display)', fontSize: '25px', letterSpacing: '-0.01em' }}
        >
          مزوّد
        </div>
        <div
          dir="ltr"
          className="mt-1 font-bold text-[color:var(--ink)]/55"
          style={{ fontSize: '9px', letterSpacing: '0.22em' }}
        >
          MUZAWWID
        </div>
      </div>
    </div>
  )
}
