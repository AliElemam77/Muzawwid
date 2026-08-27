import { useI18n } from '../lib/i18n'

type Tone = 'head' | 'product' | 'option'

const TONE: Record<Tone, string> = {
  head: 'bg-[color:var(--teal)]/25 font-extrabold',
  product: 'bg-white font-bold',
  // Same shading the real output preview uses for «خيار» rows.
  option: 'bg-[color:var(--ink)]/5',
}

/** A tiny spreadsheet drawn with a grid, so columns line up across both tables. */
function MiniTable({
  cols,
  rows,
}: {
  cols: string[]
  rows: { tone: Exclude<Tone, 'head'>; cells: string[]; note?: string }[]
}) {
  return (
    <div
      className="overflow-hidden border-2 border-[color:var(--ink)]"
      style={{ borderRadius: '10px' }}
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))`, fontSize: '11px' }}
      >
        {cols.map((c) => (
          <span key={c} className={`${TONE.head} px-2 py-1.5 text-center`}>
            {c}
          </span>
        ))}
        {rows.map((row, r) =>
          row.cells.map((cell, c) => (
            <span
              key={`${r}-${c}`}
              className={`${TONE[row.tone]} border-t border-[color:var(--ink)]/15 px-2 py-1.5 text-center`}
            >
              {cell || '—'}
            </span>
          )),
        )}
      </div>
    </div>
  )
}

function Legend({ tone, children }: { tone: 'product' | 'option'; children: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[color:var(--ink)]/70" style={{ fontSize: 'var(--fs-label)' }}>
      <span
        className={`inline-block size-3 shrink-0 border-2 border-[color:var(--ink)] ${TONE[tone]}`}
        style={{ borderRadius: '3px' }}
      />
      {children}
    </span>
  )
}

/**
 * One worked example, read top to bottom: a single row in your file becomes a
 * parent product row plus one «خيار» row per combination. Showing the output
 * rows themselves is what makes the cartesian expansion click.
 */
export default function OptionsVisualGuide() {
  const { t } = useI18n()

  const size = t('opt.visual.size')
  const color = t('opt.visual.color')
  const red = t('opt.visual.red')
  const blue = t('opt.visual.blue')
  const product = t('opt.visual.product')

  return (
    <section
      className="space-y-4 border-2 border-[color:var(--ink)] bg-[color:var(--cream)] p-4"
      style={{ borderRadius: 'var(--r-card)' }}
    >
      <div>
        <h3
          className="font-extrabold text-[color:var(--ink)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('opt.visual.title')}
        </h3>
        <p className="mt-1 text-[color:var(--ink)]/65" style={{ fontSize: 'var(--fs-label)' }}>
          {t('opt.visual.subtitle')}
        </p>
      </div>

      {/* Step 1 — what you have */}
      <div>
        <p
          className="mb-2 font-extrabold text-[color:var(--ink)]"
          style={{ fontSize: 'var(--fs-label)' }}
        >
          ١) {t('opt.visual.step1')}
        </p>
        <MiniTable
          cols={[t('opt.visual.colName'), t('opt.visual.colPrice'), size, color]}
          rows={[{ tone: 'product', cells: [product, '120', 'S, M', `${red}, ${blue}`] }]}
        />
      </div>

      {/* The expansion itself */}
      <p
        className="flex flex-wrap items-center justify-center gap-2 text-center font-extrabold text-[color:var(--violet)]"
        style={{ fontSize: 'var(--fs-label)' }}
      >
        <span aria-hidden className="text-xl">
          ↓
        </span>
        {t('opt.visual.math', { size, color })}
      </p>

      {/* Step 2 — what comes out */}
      <div>
        <p
          className="mb-2 font-extrabold text-[color:var(--ink)]"
          style={{ fontSize: 'var(--fs-label)' }}
        >
          ٢) {t('opt.visual.step2')}
        </p>
        <MiniTable
          cols={[t('opt.visual.colType'), t('opt.visual.colName'), size, color, t('opt.visual.colPrice')]}
          rows={[
            { tone: 'product', cells: [t('opt.visual.typeProduct'), product, '', '', '120'] },
            { tone: 'option', cells: [t('opt.visual.typeOption'), '', 'S', red, ''] },
            { tone: 'option', cells: [t('opt.visual.typeOption'), '', 'S', blue, ''] },
            { tone: 'option', cells: [t('opt.visual.typeOption'), '', 'M', red, ''] },
            { tone: 'option', cells: [t('opt.visual.typeOption'), '', 'M', blue, ''] },
          ]}
        />
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <Legend tone="product">{t('opt.visual.legendProduct')}</Legend>
          <Legend tone="option">{t('opt.visual.legendOption')}</Legend>
        </div>
      </div>

      {/* The other case people hit: one axis split over two columns. */}
      <div className="border-t-2 border-[color:var(--ink)]/15 pt-4">
        <p
          className="mb-2 font-extrabold text-[color:var(--ink)]"
          style={{ fontSize: 'var(--fs-label)' }}
        >
          {t('opt.visual.mergeTitle')}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <MiniTable
            cols={[t('opt.visual.sizeOne'), t('opt.visual.sizeTwo')]}
            rows={[{ tone: 'product', cells: ['S, M', 'L'] }]}
          />
          <span aria-hidden className="text-xl font-extrabold text-[color:var(--violet)]">
            ←
          </span>
          <span
            className="border-2 border-[color:var(--ink)] bg-white px-3 py-1.5 font-bold"
            style={{ borderRadius: 'var(--r-pill)', fontSize: '11px' }}
          >
            {t('opt.visual.mergeResult', { size })}
          </span>
        </div>
        <p className="mt-2 text-[color:var(--ink)]/65" style={{ fontSize: 'var(--fs-label)' }}>
          {t('opt.visual.mergeBody')}
        </p>
      </div>
    </section>
  )
}
