import type { SourceSheet } from '../lib/reader'
import type { MappingConfig, FieldSource } from '../lib/types'
import type { PlatformId } from '../lib/platforms'
import { splitValues, cleanPrice } from '../lib/build'
import { applyPriceRules } from '../lib/pricing'
import { F } from '../lib/salla'
import { isImageUrl } from '../lib/urls'
import { useI18n } from '../lib/i18n'
import type { SectionKey } from './MappingPanel'

const FILE_ROWS = 4

/** Resolve a single mapped field for one source row (mirrors the pipeline's
 *  simple-field resolution; used only for the live snippet, never for export). */
function fieldVal(src: FieldSource | undefined, row: Record<string, string>): string {
  if (!src || src.kind === 'none') return ''
  if (src.kind === 'constant') return src.value
  return row[src.column] ?? ''
}

/** Columns that matter for the active section — highlighted in the file table. */
function relevantColumns(section: SectionKey, config: MappingConfig): Set<string> {
  const set = new Set<string>()
  if (section === 'fields') {
    for (const src of Object.values(config.fields))
      if (src.kind === 'column') set.add(src.column)
  } else if (section === 'images') {
    config.imageColumns.forEach((c) => set.add(c))
  } else if (section === 'sku') {
    if (config.sku.mode === 'column' || config.sku.mode === 'regex') set.add(config.sku.column)
  } else if (section === 'options') {
    config.options.forEach((o) => {
      set.add(o.column)
      if (o.swatchColumn) set.add(o.swatchColumn)
      if (o.nameColumn) set.add(o.nameColumn)
    })
  } else if (section === 'export') {
    // The price formulas read these three, whichever way they were mapped.
    for (const f of [F.price, F.discountPrice, F.cost]) {
      const src = config.fields[f]
      if (src?.kind === 'column') set.add(src.column)
    }
  }
  return set
}

/** Small key → value line inside the live-preview snippet. */
function SnippetRow({ label, value }: { label: string; value: string }) {
  const empty = !value
  return (
    <div className="flex items-baseline justify-between gap-3 py-1" style={{ fontSize: 'var(--fs-table)' }}>
      <span className="shrink-0 font-bold text-[color:var(--ink)]/70">{label}</span>
      <span
        dir="auto"
        className={
          'min-w-0 truncate text-end font-medium ' +
          (empty ? 'text-[color:var(--ink)]/35 italic' : 'text-[color:var(--ink)]')
        }
      >
        {value || '—'}
      </span>
    </div>
  )
}

/**
 * Persistent panel shown beside every Map sub-step: a compact quick-view of the
 * source file plus a live, section-aware snippet computed from the first row —
 * so the user never loses sight of their data while mapping.
 */
export default function MappingQuickView({
  sheet,
  config,
  section,
  platform,
}: {
  sheet: SourceSheet
  config: MappingConfig
  section: SectionKey
  platform: PlatformId
}) {
  const { t } = useI18n()
  const row0 = sheet.rows[0] ?? {}
  const highlight = relevantColumns(section, config)
  const fileRows = sheet.rows.slice(0, FILE_ROWS)
  const moreRows = sheet.rows.length - fileRows.length

  return (
    <div className="space-y-4">
      {/* ---- Live snippet (section-aware) ---------------------------------- */}
      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <span
            className="font-extrabold text-[color:var(--ink)]"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-label)' }}
          >
            {t('qv.snippet')}
          </span>
          <span className="pill pill--violet" style={{ fontSize: '11px', padding: '0.1rem 0.5rem' }}>
            {t('qv.firstRow')}
          </span>
        </div>
        <div className="divide-y divide-[color:var(--ink)]/10">
          <Snippet section={section} config={config} row={row0} platform={platform} />
        </div>
      </div>

      {/* ---- File quick-view (always present) ------------------------------ */}
      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <span
            className="font-extrabold text-[color:var(--ink)]"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-label)' }}
          >
            {t('qv.file')}
          </span>
          <span className="pill" style={{ fontSize: '11px', padding: '0.1rem 0.5rem' }}>
            {sheet.headers.length} × {sheet.rows.length}
          </span>
        </div>

        {sheet.rows.length === 0 ? (
          <p className="py-4 text-center text-[color:var(--ink)]/50" style={{ fontSize: 'var(--fs-table)' }}>
            {t('qv.empty')}
          </p>
        ) : (
          <>
            <div className="scroll-thin overflow-x-auto border border-[color:var(--ink)]" style={{ borderRadius: '10px' }}>
              <table className="min-w-full border-collapse" style={{ fontSize: 'var(--fs-table)' }}>
                <thead>
                  <tr className="bg-[color:var(--ink)]">
                    {sheet.headers.map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-2 py-1.5 text-start font-bold text-[color:var(--cream)]"
                        style={
                          highlight.has(h)
                            ? { boxShadow: 'inset 0 -3px 0 var(--teal)' }
                            : undefined
                        }
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fileRows.map((r, i) => (
                    <tr key={i} className="bg-[color:var(--white)]">
                      {sheet.headers.map((h) => (
                        <td
                          key={h}
                          dir="auto"
                          title={r[h] ?? ''}
                          className={
                            'max-w-[10rem] truncate whitespace-nowrap border-t border-[color:var(--ink)]/15 px-2 py-1.5 ' +
                            (highlight.has(h)
                              ? 'bg-[color:var(--teal)]/10 font-medium text-[color:var(--ink)]'
                              : 'text-[color:var(--ink)]/70')
                          }
                        >
                          {r[h] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {moreRows > 0 && (
              <p className="mt-1.5 text-center text-[color:var(--ink)]/45" style={{ fontSize: '11px' }}>
                {t('qv.rowsMore', { n: moreRows })}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/** The section-specific body of the live snippet. */
function Snippet({
  section,
  config,
  row,
  platform,
}: {
  section: SectionKey
  config: MappingConfig
  row: Record<string, string>
  platform: PlatformId
}) {
  const { t } = useI18n()

  if (section === 'fields') {
    const mapped = Object.entries(config.fields).filter(([, s]) => s.kind !== 'none')
    if (mapped.length === 0) return <Empty />
    return (
      <>
        {mapped.slice(0, 8).map(([header, src]) => (
          <SnippetRow key={header} label={header} value={fieldVal(src, row)} />
        ))}
      </>
    )
  }

  if (section === 'images') {
    const urls = config.imageColumns
      .flatMap((c) => splitValues(row[c] ?? ''))
      .filter((u) => isImageUrl(u))
    if (urls.length === 0) return <Empty />
    return (
      <>
        <SnippetRow label={t('qv.imagesCount', { n: urls.length })} value={urls[0]} />
        {urls.slice(1, 4).map((u, i) => (
          <SnippetRow key={i} label="" value={u} />
        ))}
      </>
    )
  }

  if (section === 'sku') {
    return <SnippetRow label={t('qv.skuSample')} value={skuSample(config, row)} />
  }

  if (section === 'options') {
    if (config.options.length === 0) return <Empty />
    const counts = config.options.map((o) => splitValues(row[o.column] ?? '').length || 0)
    const combos = counts.reduce((a, n) => a * (n || 1), 1)
    return (
      <>
        <SnippetRow
          label={t('qv.optionsNote', { combos, axes: config.options.length })}
          value=""
        />
        {config.options.map((o, i) => (
          <SnippetRow key={i} label={o.name || o.column} value={splitValues(row[o.column] ?? '').join(' · ')} />
        ))}
      </>
    )
  }

  if (section === 'defaults') {
    const d = config.defaults
    return (
      <>
        <SnippetRow label="نوع المنتج" value={d.productType} />
        <SnippetRow label="الوزن" value={`${d.weight} ${d.weightUnit}`} />
        <SnippetRow label="يتطلب شحن" value={d.requiresShipping} />
        <SnippetRow label="خاضع للضريبة" value={d.taxable} />
      </>
    )
  }

  if (section === 'export') {
    // Salla has no quantity column, so only the price formulas are shown there.
    return (
      <>
        {platform !== 'salla' && (
          <SnippetRow
            label={t('qty.label')}
            value={config.quantity.mode === 'fixed' ? config.quantity.value : config.quantity.mode}
          />
        )}
        {config.priceRules.length === 0 ? (
          <SnippetRow label={t('price.label')} value="" />
        ) : (
          config.priceRules.map((r, i) => (
            <SnippetRow key={i} label={t(`price.f.${r.target}`)} value={priceSample(config, row, i)} />
          ))
        )}
      </>
    )
  }

  return <Empty />
}

/**
 * The value rule `i` would write for this row — the rules up to and including
 * it, applied to the row's real prices. Sample only; export uses the real path.
 */
function priceSample(config: MappingConfig, row: Record<string, string>, i: number): string {
  const prices = applyPriceRules(
    {
      price: cleanPrice(fieldVal(config.fields[F.price], row)),
      salePrice: cleanPrice(fieldVal(config.fields[F.discountPrice], row)),
      cost: cleanPrice(fieldVal(config.fields[F.cost], row)),
    },
    config.priceRules.slice(0, i + 1),
  )
  return prices[config.priceRules[i].target]
}

function Empty() {
  const { t } = useI18n()
  return (
    <p className="py-2 text-[color:var(--ink)]/40 italic" style={{ fontSize: 'var(--fs-table)' }}>
      {t('qv.none')}
    </p>
  )
}

/** A representative SKU for one row (sample only — export uses the real path). */
function skuSample(config: MappingConfig, row: Record<string, string>): string {
  const s = config.sku
  if (s.mode === 'none') return ''
  if (s.mode === 'column') return row[s.column] ?? ''
  if (s.mode === 'auto') return `${s.prefix}1`
  // regex: extract /p(\d+) from the column value
  const m = (row[s.column] ?? '').match(/p(\d+)/i)
  return m ? `${s.prefix}${m[1]}` : ''
}
