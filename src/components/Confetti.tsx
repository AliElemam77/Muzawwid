/**
 * The Memphis confetti layer: flat, black-outlined geometric shapes scattered
 * behind the hero, drifting/spinning/bobbing via CSS keyframes only (no JS, so
 * the layer costs nothing at runtime and honours prefers-reduced-motion via the
 * global freeze in tokens.css).
 *
 * Purely decorative — the whole layer is aria-hidden and pointer-events:none,
 * which is what licenses it to use --coral (elsewhere reserved for errors).
 * Positions are percentage-based and deliberately asymmetric; each shape sits
 * clear of the copy column at desktop, and the layer clips its own overflow so
 * a drifting shape can never widen the page.
 */

const OL = 'var(--ink)'

/**
 * One placed shape.
 *
 * Positions are LOGICAL (insetInlineStart/End), never physical left/right: the
 * hero grid mirrors under `dir="rtl"`, so a shape pinned to `right` would sit
 * over the mockup in English and over the HEADLINE in Arabic. Inline-end is the
 * mockup side in both directions, which is where the empty space is — the copy
 * column (inline-start) stays clear apart from the top band.
 */
interface Shape {
  key: string
  anim: 'drift' | 'spin' | 'bob' | 'sway'
  /** Stagger so the shapes never pulse in unison. */
  delay: string
  style: React.CSSProperties
  svg: React.ReactNode
}

const SHAPES: Shape[] = [
  {
    key: 'triangle',
    anim: 'drift',
    delay: '0s',
    style: { top: '1%', insetInlineEnd: '7%' },
    svg: (
      <svg width="58" height="52" viewBox="0 0 58 52" aria-hidden>
        <path d="M29 4 L54 47 H4 Z" fill="var(--coral)" stroke={OL} strokeWidth="4" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'arc',
    anim: 'sway',
    delay: '1.2s',
    style: { top: '22%', insetInlineEnd: '1%' },
    svg: (
      <svg width="62" height="62" viewBox="0 0 62 62" aria-hidden>
        <path d="M6 56 A50 50 0 0 1 56 6 L56 56 Z" fill="var(--teal)" stroke={OL} strokeWidth="4" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'dotted-circle',
    anim: 'spin',
    delay: '0s',
    style: { top: '62%', insetInlineEnd: '2%' },
    svg: (
      <svg width="54" height="54" viewBox="0 0 54 54" aria-hidden>
        <circle cx="27" cy="27" r="23" fill="none" stroke={OL} strokeWidth="4" strokeDasharray="7 7" />
        <circle cx="27" cy="27" r="9" fill="var(--mustard)" stroke={OL} strokeWidth="3" />
      </svg>
    ),
  },
  {
    key: 'plus',
    anim: 'spin',
    delay: '0s',
    style: { bottom: '4%', insetInlineEnd: '34%' },
    svg: (
      <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden>
        <path
          d="M17 4 h12 v13 h13 v12 h-13 v13 h-12 v-13 h-13 v-12 h13 Z"
          fill="var(--violet)"
          stroke={OL}
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'squiggle',
    anim: 'sway',
    delay: '0.6s',
    style: { top: '0%', insetInlineStart: '22%' },
    svg: (
      <svg width="86" height="26" viewBox="0 0 86 26" aria-hidden>
        <path
          d="M3 15 q10 -14 20 0 t20 0 t20 0 t20 0"
          fill="none"
          stroke={OL}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: 'half-circle',
    anim: 'bob',
    delay: '1.8s',
    style: { bottom: '1%', insetInlineEnd: '47%' },
    svg: (
      <svg width="60" height="34" viewBox="0 0 60 34" aria-hidden>
        <path d="M4 30 A26 26 0 0 1 56 30 Z" fill="var(--mustard)" stroke={OL} strokeWidth="4" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'dot',
    anim: 'bob',
    delay: '0.4s',
    style: { top: '44%', insetInlineEnd: '0%' },
    svg: (
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
        <circle cx="13" cy="13" r="10" fill="var(--teal)" stroke={OL} strokeWidth="3.5" />
      </svg>
    ),
  },
  {
    key: 'zigzag',
    anim: 'bob',
    delay: '2.4s',
    style: { top: '52%', insetInlineEnd: '45%' },
    svg: (
      <svg width="72" height="30" viewBox="0 0 72 30" aria-hidden>
        <path
          d="M3 22 L17 7 L31 22 L45 7 L59 22"
          fill="none"
          stroke="var(--sky)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'striped-circle',
    anim: 'spin',
    delay: '0s',
    style: { top: '7%', insetInlineEnd: '28%' },
    svg: (
      <svg width="50" height="50" viewBox="0 0 50 50" aria-hidden>
        <defs>
          <pattern id="cf-stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="var(--cream)" />
            <rect width="4" height="8" fill="var(--coral)" />
          </pattern>
        </defs>
        <circle cx="25" cy="25" r="21" fill="url(#cf-stripes)" stroke={OL} strokeWidth="4" />
      </svg>
    ),
  },
]

export default function Confetti() {
  return (
    <div className="confetti-layer" aria-hidden="true">
      {SHAPES.map((s) => (
        <span
          key={s.key}
          className={`confetti confetti--${s.anim}`}
          style={{ ...s.style, animationDelay: s.delay }}
        >
          {s.svg}
        </span>
      ))}
    </div>
  )
}
