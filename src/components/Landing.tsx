import { PLATFORMS } from '../lib/platforms'
import { useI18n } from '../lib/i18n'
import { Button } from './ui'
import Confetti from './Confetti'
import MadeBy from './MadeBy'

/**
 * Marketing landing shown only before a file is loaded (App swaps it out for the
 * mapping flow once there is a workbook).
 *
 * Every claim here is checkable against the code: the "no server" line is true
 * because the whole pipeline is client-side, and the export strip lists the real
 * `PLATFORMS` readiness flags. Nothing invents users, counts, or customer logos.
 */

/** A headline word wearing a flat marker bar. */
function Mark({ children, teal = false }: { children: string; teal?: boolean }) {
  return <span className={`marker ${teal ? 'marker--teal' : ''}`}>{children}</span>
}

/* ------------------------------- hero mockup ------------------------------ */

/** One row of the fake-but-accurate output grid. */
function MockRow({ kind, name, value }: { kind: 'product' | 'option'; name: string; value: string }) {
  const isProduct = kind === 'product'
  return (
    <div
      className="flex items-center gap-2 border-b px-2.5 py-1.5 last:border-b-0"
      style={{ borderColor: 'color-mix(in srgb, var(--ink) 15%, transparent)' }}
    >
      <span
        className="shrink-0 border px-1.5 py-0.5 font-bold"
        style={{
          fontSize: '10px',
          borderRadius: 'var(--r-pill)',
          borderColor: 'var(--ink)',
          background: isProduct ? 'var(--white)' : 'var(--violet)',
          color: isProduct ? 'var(--ink)' : 'var(--on-violet)',
        }}
      >
        {isProduct ? 'منتج' : 'خيار'}
      </span>
      <span
        className="min-w-0 flex-1 truncate font-bold"
        style={{ fontSize: 'var(--fs-table)', opacity: isProduct ? 1 : 0.75 }}
      >
        {name}
      </span>
      <span className="shrink-0 font-medium" style={{ fontSize: '11px', opacity: 0.6 }}>
        {value}
      </span>
    </div>
  )
}

/**
 * A tilted mockup of what the tool actually produces — a Salla import sheet with
 * one منتج row and its خيار rows. Depicting the REAL output beats a generic
 * dashboard: it doubles as an explanation of the product.
 */
function OutputMockup() {
  const { t } = useI18n()
  return (
    <div
      className="card overflow-hidden"
      style={{ transform: 'rotate(-2deg)', borderRadius: 'var(--r-drop)' }}
    >
      {/* browser chrome */}
      <div
        className="flex items-center gap-2 border-b px-3 py-2"
        style={{ borderColor: 'var(--ink)', background: 'var(--cream)' }}
      >
        <span className="flex gap-1.5">
          {['var(--coral)', 'var(--mustard)', 'var(--teal)'].map((c) => (
            <span
              key={c}
              className="block h-3 w-3 rounded-full border-2"
              style={{ background: c, borderColor: 'var(--ink)' }}
            />
          ))}
        </span>
        <span
          dir="ltr"
          className="ms-1 font-bold"
          style={{ fontFamily: 'var(--font-display)', fontSize: '12px' }}
        >
          salla-import.xlsx
        </span>
      </div>

      <div className="p-3.5">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <span className="font-extrabold" style={{ fontFamily: 'var(--font-display)', fontSize: '15px' }}>
            {t('lp.mock.sheet')}
          </span>
          <span className="pill pill--teal" style={{ fontSize: '11px' }}>
            {t('lp.mock.headers')}
          </span>
        </div>

        <div className="border" style={{ borderColor: 'var(--ink)', borderRadius: '10px' }}>
          <MockRow kind="product" name={t('lp.mock.p1')} value="299" />
          {['S', 'M', 'L'].map((size) => (
            <MockRow key={size} kind="option" name={`${t('lp.mock.optName')} · ${size}`} value="299" />
          ))}
        </div>

        <ul className="mt-3 space-y-1.5">
          {['lp.mock.check1', 'lp.mock.check2', 'lp.mock.check3'].map((k) => (
            <li
              key={k}
              className="flex items-center gap-2 border px-2 py-1.5"
              style={{ borderColor: 'var(--ink)', borderRadius: '10px', fontSize: 'var(--fs-table)' }}
            >
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center border-2 font-bold text-white"
                style={{ background: 'var(--teal)', borderColor: 'var(--ink)', borderRadius: '5px', fontSize: '9px' }}
              >
                ✓
              </span>
              <span className="font-medium">{t(k)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* --------------------------------- landing -------------------------------- */

const FEATURES: { key: string; tone: 'teal' | 'violet' | 'mustard'; glyph: string }[] = [
  { key: 'automap', tone: 'teal', glyph: '⚡' },
  { key: 'variants', tone: 'violet', glyph: '⧉' },
  { key: 'validate', tone: 'mustard', glyph: '✓' },
]

export default function Landing({ onStart }: { onStart: () => void }) {
  const { t } = useI18n()

  return (
    <div className="mb-10">
      {/* ---- Hero ---------------------------------------------------------- */}
      <section className="relative">
        <Confetti />
        <div className="relative z-10 grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_.95fr] lg:py-14">
          {/* copy */}
          <div>
            <span className="pill pill--violet pill--solid">
              <span
                className="block h-2 w-2 rounded-full border"
                style={{ background: 'var(--mustard)', borderColor: 'var(--ink)' }}
              />
              {t('lp.eyebrow')}
            </span>

            <h1
              className="mt-4 font-extrabold text-(--ink)"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.5rem, 5vw, 4.25rem)',
                lineHeight: 1.08,
                letterSpacing: '-0.02em',
              }}
            >
              {t('lp.h1.a')} <Mark>{t('lp.h1.mark1')}</Mark> {t('lp.h1.b')}{' '}
              <Mark teal>{t('lp.h1.mark2')}</Mark>
            </h1>

            <p
              className="mt-4 max-w-xl font-medium text-(--ink)/75"
              style={{ fontSize: '19px', lineHeight: 1.6 }}
            >
              {t('lp.lead')}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button onClick={onStart}>{t('lp.cta.primary')}</Button>
              <Button variant="ghost" onClick={onStart}>
                {t('lp.cta.secondary')}
              </Button>
            </div>

            {/* Who built it — stated up front, not buried in the footer. */}
            <div className="mt-7">
              <MadeBy size={30} />
            </div>

            {/* Proof row — the honest kind: what the tool actually guarantees,
                not a made-up customer count. */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="flex gap-1.5">
                {['xlsx', 'xls', 'csv'].map((ext, i) => (
                  <span
                    key={ext}
                    dir="ltr"
                    className="hard-2 flex items-center px-2 py-1 font-bold"
                    style={{
                      fontSize: '11px',
                      borderRadius: 'var(--r-pill)',
                      background: [
                        'var(--teal)',
                        'var(--mustard)',
                        'var(--sky)',
                      ][i],
                      color: 'var(--ink)',
                    }}
                  >
                    .{ext}
                  </span>
                ))}
              </span>
              <p
                className="min-w-0 flex-1 font-medium text-[color:var(--ink)]/70"
                style={{ fontSize: 'var(--fs-label)', lineHeight: 1.5 }}
              >
                {t('lp.proof')}
              </p>
            </div>
          </div>

          {/* product mockup */}
          <div className="mx-auto w-full max-w-md lg:mx-0">
            <OutputMockup />
          </div>
        </div>
      </section>

      {/* ---- Export strip (full-bleed black) -------------------------------- */}
      {/* The reference's "trusted by" band, made truthful: these are the export
          targets this app really has, flagged by their real readiness. */}
      <section
        className="full-bleed border-y-[3px] py-5"
        style={{ background: 'var(--ink)', borderColor: 'var(--ink)' }}
      >
        <div className="mx-auto flex max-w-[104rem] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-6">
          <span
            className="font-extrabold tracking-widest text-[color:var(--mustard)]"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-label)' }}
          >
            {t('lp.strip.label')}
          </span>
          <ul className="flex flex-wrap items-center gap-x-7 gap-y-3">
            {PLATFORMS.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <span
                  className="font-bold text-[color:var(--cream)]"
                  style={{ fontFamily: 'var(--font-display)', fontSize: '17px', opacity: p.ready ? 0.95 : 0.45 }}
                >
                  {t(p.nameKey)}
                </span>
                <span
                  className="border px-1.5 font-bold"
                  style={{
                    fontSize: '10px',
                    borderRadius: 'var(--r-pill)',
                    borderColor: p.ready ? 'var(--teal)' : 'var(--cream)',
                    color: p.ready ? 'var(--teal)' : 'var(--cream)',
                    opacity: p.ready ? 1 : 0.5,
                  }}
                >
                  {t(p.ready ? 'platform.ready' : 'platform.soonBadge')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Features ------------------------------------------------------ */}
      <section className="py-12 text-center">
        <span className="pill pill--violet pill--solid">{t('lp.feat.eyebrow')}</span>
        <h2
          className="mx-auto mt-4 max-w-3xl font-extrabold text-[color:var(--ink)]"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 3vw, 2.85rem)',
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
          }}
        >
          {t('lp.feat.h2')}
        </h2>

        <div className="mt-9 grid gap-6 text-start md:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.key} className="card relative overflow-hidden p-5">
              <span
                className="hard-2 flex h-14 w-14 items-center justify-center font-extrabold"
                style={{
                  borderRadius: '16px',
                  background: `var(--${f.tone})`,
                  color: `var(--on-${f.tone})`,
                  fontSize: '24px',
                }}
              >
                {f.glyph}
              </span>
              <h3
                className="mt-4 font-extrabold text-[color:var(--ink)]"
                style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}
              >
                {t(`lp.feat.${f.key}.title`)}
              </h3>
              <p
                className="mt-1.5 font-medium text-[color:var(--ink)]/70"
                style={{ fontSize: '15px', lineHeight: 1.6 }}
              >
                {t(`lp.feat.${f.key}.body`)}
              </p>
              {/* soft corner accent bleeding off the bottom-inline-end */}
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-10 h-28 w-28 rounded-full"
                style={{
                  insetInlineEnd: '-2.5rem',
                  background: `var(--${f.tone})`,
                  opacity: 0.16,
                }}
              />
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
