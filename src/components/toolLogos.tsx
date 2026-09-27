/**
 * Logos for the company's other tools: a flat coloured tile holding a bold,
 * high-contrast glyph. No gradients — tokens.css forbids them.
 *
 * Glyph colours are literal, NOT theme tokens. These are marks with a fixed
 * reading — a light plate carrying dark ink outlines — and they sit on their
 * own coloured tile, not on the page. Wired to `--ink` / `--white` they
 * inverted when the theme went dark, leaving a white lightning bolt on a
 * yellow tile.
 *
 * Each is sized by one `size` prop; the inner SVG scales from a 24×24 grid.
 */
/** Dark ink for outlines and glyphs sitting on a light or coloured plate. */
const GLYPH_INK = '#050505'
/** The light plate inside a coloured tile. */
const GLYPH_PLATE = '#FFFFFF'

function Tile({
  size,
  bg,
  children,
}: {
  size: number
  bg: string
  children: React.ReactNode
}) {
  return (
    <span
      className="hard-2 flex shrink-0 items-center justify-center"
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.26), background: bg }}
      aria-hidden="true"
    >
      <svg width={Math.round(size * 0.6)} height={Math.round(size * 0.6)} viewBox="0 0 24 24">
        {children}
      </svg>
    </span>
  )
}

/**
 * wepix — direct image upload. An image frame (sun + mountains) with an upload
 * arrow badge, so the glyph reads as "put a picture up" at a glance.
 */
export function WepixLogo({ size = 56 }: { size?: number }) {
  return (
    <Tile size={size} bg="var(--violet)">
      {/* picture frame */}
      <rect
        x="2.5"
        y="4.5"
        width="19"
        height="15"
        rx="3"
        fill={GLYPH_PLATE}
        stroke={GLYPH_INK}
        strokeWidth="2"
      />
      {/* sun */}
      <circle cx="8" cy="9.5" r="2" fill="var(--mustard)" stroke={GLYPH_INK} strokeWidth="1.4" />
      {/* mountains */}
      <path
        d="M3.5 19 L9 13 L12.5 16.5 L16 12.5 L20.5 17.5 V19 Z"
        fill="var(--teal)"
        stroke={GLYPH_INK}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* upload badge — a coral disc with an up arrow, bottom-trailing corner */}
      <circle cx="18" cy="18" r="5" fill="var(--coral)" stroke={GLYPH_INK} strokeWidth="1.6" />
      <path
        d="M18 20.4 V15.9 M15.9 17.7 L18 15.6 L20.1 17.7"
        fill="none"
        stroke={GLYPH_INK}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Tile>
  )
}

/**
 * Salla Vite Extension — a VS Code extension that builds Salla themes 10× faster.
 * A bold lightning bolt (Vite's speed motif) with two motion streaks behind it.
 */
export function SallaViteLogo({ size = 56 }: { size?: number }) {
  return (
    <Tile size={size} bg="var(--mustard)">
      {/* motion streaks */}
      <path
        d="M2 8 H7 M2 12 H6 M2 16 H7"
        stroke={GLYPH_INK}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* lightning bolt */}
      <path
        d="M15 2 L7.5 13 H12 L10.5 22 L19 10.5 H14 L16.5 2 Z"
        fill={GLYPH_INK}
        stroke={GLYPH_INK}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </Tile>
  )
}
