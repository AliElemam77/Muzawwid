import type { ComponentType } from 'react'
import { Package, Layers } from 'lucide-react'
import { useI18n } from '../../../lib/i18n'

export type Mode = 'products' | 'quantities'

/**
 * The fork at the top of the tool.
 *
 * Products and quantities are two different Salla files with two different
 * jobs, and picking the wrong one wastes the merchant's time — so the choice
 * is made once, up front, rather than hidden behind a tab later.
 */
export default function ModeSelector({ onPick }: { onPick: (mode: Mode) => void }) {
  const { t } = useI18n()

  const cards: {
    mode: Mode
    Icon: ComponentType<{ className?: string }>
    titleKey: string
    bodyKey: string
    tone: string
    iconColor: string
  }[] = [
    {
      mode: 'products',
      Icon: Package,
      titleKey: 'mode.products.title',
      bodyKey: 'mode.products.body',
      tone: 'var(--violet)',
      iconColor: 'var(--on-violet)',
    },
    {
      mode: 'quantities',
      Icon: Layers,
      titleKey: 'mode.quantities.title',
      bodyKey: 'mode.quantities.body',
      tone: 'var(--teal)',
      iconColor: 'var(--on-teal)',
    },
  ]

  return (
    <section>
      <h2
        className="mb-1 font-extrabold text-[color:var(--ink)]"
        style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-section)' }}
      >
        {t('mode.title')}
      </h2>
      <p className="mb-5 text-[color:var(--ink)]/70" style={{ fontSize: 'var(--fs-label)' }}>
        {t('mode.subtitle')}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <button
            key={card.mode}
            type="button"
            onClick={() => onPick(card.mode)}
            className="card lift p-5 text-start transition group"
            style={{ borderColor: 'var(--ink)' }}
          >
            <span
              aria-hidden
              className="mb-3 flex h-12 w-12 items-center justify-center hard-2 transition-transform group-hover:scale-105"
              style={{ background: card.tone, borderRadius: 'var(--r-card)', color: card.iconColor }}
            >
              <card.Icon className="size-6" />
            </span>
            <span
              className="block font-extrabold text-[color:var(--ink)]"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-section)' }}
            >
              {t(card.titleKey)}
            </span>
            <span
              className="mt-1 block text-[color:var(--ink)]/70"
              style={{ fontSize: 'var(--fs-label)' }}
            >
              {t(card.bodyKey)}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
