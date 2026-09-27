import { useI18n } from '../lib/i18n'

type Tone = 'head' | 'product' | 'option'

const TONE: Record<Tone, string> = {
  head: 'bg-[#1D1D1D] font-black text-white',
  product: 'bg-[#181818] font-bold text-white',
  option: 'bg-[#101010] text-[#D4D4D4]',
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
      className="overflow-hidden border border-white/15 rounded-xl bg-[#0F0F0F]"
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))`, fontSize: '11px' }}
      >
        {cols.map((c) => (
          <span key={c} className={`${TONE.head} px-2 py-1.5 text-center border-b border-white/10`}>
            {c}
          </span>
        ))}
        {rows.map((row, r) =>
          row.cells.map((cell, c) => (
            <span
              key={`${r}-${c}`}
              className={`${TONE[row.tone]} border-b border-white/5 last:border-b-0 px-2 py-1.5 text-center`}
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
    <span className="flex items-center gap-1.5 text-[#D4D4D4] text-xs">
      <span
        className={`inline-block size-3 shrink-0 rounded-sm border border-white/20 ${TONE[tone]}`}
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
      className="space-y-4 border border-white/10 bg-[#141414] p-4 rounded-2xl"
    >
      <div>
        <h3
          className="font-black text-white text-base"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('opt.visual.title')}
        </h3>
        <p className="mt-1 text-xs text-[#D4D4D4]">
          {t('opt.visual.subtitle')}
        </p>
      </div>

      {/* Step 1 — what you have */}
      <div>
        <p
          className="mb-2 font-black text-white text-xs"
        >
          {t('opt.visual.stepNo', { n: 1 })} {t('opt.visual.step1')}
        </p>
        <MiniTable
          cols={[t('opt.visual.colName'), t('opt.visual.colPrice'), size, color]}
          rows={[{ tone: 'product', cells: [product, '120', 'S, M', `${red}, ${blue}`] }]}
        />
      </div>

      {/* The expansion itself */}
      <p
        className="flex flex-wrap items-center justify-center gap-2 text-center font-black text-[#FF6B50] text-xs"
      >
        <span aria-hidden className="text-xl">
          ↓
        </span>
        {t('opt.visual.math', { size, color })}
      </p>

      {/* Step 2 — what comes out */}
      <div>
        <p
          className="mb-2 font-black text-white text-xs"
        >
          {t('opt.visual.stepNo', { n: 2 })} {t('opt.visual.step2')}
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
      <div className="border-t border-white/10 pt-4">
        <p
          className="mb-2 font-black text-white text-xs"
        >
          {t('opt.visual.mergeTitle')}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <MiniTable
            cols={[t('opt.visual.sizeOne'), t('opt.visual.sizeTwo')]}
            rows={[{ tone: 'product', cells: ['S, M', 'L'] }]}
          />
          <span aria-hidden className="text-xl font-extrabold text-[#FF6B50] ltr:rotate-180 inline-block">
            ←
          </span>
          <span
            className="border border-white/15 bg-[#1E1E1E] text-white px-3 py-1.5 font-bold rounded-full text-[11px]"
          >
            {t('opt.visual.mergeResult', { size })}
          </span>
        </div>
        <p className="mt-2 text-xs text-[#D4D4D4]">
          {t('opt.visual.mergeBody')}
        </p>
      </div>
    </section>
  )
}
