import {
  ShieldCheck,
  Sparkles,
  Zap,
  Package,
  Lock,
  FolderArchive,
  ExternalLink,
  Camera,
  ArrowUpRight,
  FileSpreadsheet,
} from 'lucide-react'
import { PLATFORMS, type PlatformId } from '../lib/platforms'
import { useReveal } from '../lib/useReveal'
import { LINKS } from '../lib/links'
import { useI18n } from '../lib/i18n'
import type { SourceWorkbook } from '../lib/reader'
import type { Mode } from '../features/quantities/components/ModeSelector'
import MadeBy from './MadeBy'
import { WepixLogo } from './toolLogos'
import AuthorCredit from './AuthorCredit'
import Uploader from './Uploader'

/* ------------------------------- hero mockup ------------------------------ */

/** One row of the fake-but-accurate output grid. */
function MockRow({
  kind,
  name,
  value,
  currency,
}: {
  kind: 'product' | 'option'
  name: string
  value: string
  currency: string
}) {
  const { t } = useI18n()
  const isProduct = kind === 'product'
  return (
    <div className="flex items-center gap-2.5 border-b border-white/10 px-3 py-2 last:border-b-0">
      <span
        className="shrink-0 px-2 py-0.5 text-[10px] font-black rounded-md"
        style={{
          background: isProduct ? '#FF6B50' : '#222222',
          color: isProduct ? '#050505' : '#E0E0E0',
          border: isProduct ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        {isProduct ? t('lp.mock.optProduct') : t('lp.mock.optVariant')}
      </span>
      <span
        className="min-w-0 flex-1 truncate font-bold text-xs text-[#FFFFFF]"
      >
        {name}
      </span>
      <span className="shrink-0 font-mono text-[11px] font-bold text-[#D4D4D4]">
        {value} {currency}
      </span>
    </div>
  )
}

/**
 * A sleek mockup of what the tool produces with high contrast and full i18n.
 */
function OutputMockup() {
  const { t, lang } = useI18n()
  const currency = lang === 'ar' ? 'ر.س' : 'SAR'

  return (
    <div className="relative rounded-2xl overflow-hidden bg-[#111111] border border-white/15 shadow-2xl transition-all duration-500 hover:border-white/30">
      {/* Tilted #FF6B50 badge */}
      <div
        className="absolute -top-1 -right-1 z-20 bg-[#FF6B50] text-[#050505] text-[10px] font-black tracking-wider px-3 py-1 rounded shadow-lg"
        style={{ transform: 'rotate(-12deg)' }}
      >
        {t('lp.bento.mockReady')}
      </div>

      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 px-3.5 py-2.5 bg-[#161616]">
        <span className="flex gap-1.5">
          <span className="block h-2.5 w-2.5 rounded-full bg-[#FF6B50]" />
          <span className="block h-2.5 w-2.5 rounded-full bg-[#ffc531]" />
          <span className="block h-2.5 w-2.5 rounded-full bg-[#12b3a4]" />
        </span>
        <span
          dir="ltr"
          className="ms-2 font-mono text-xs font-bold text-[#CCCCCC]"
        >
          salla-import.xlsx
        </span>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="font-extrabold text-sm text-[#FFFFFF]">
            {t('lp.mock.sheet')}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#12b3a4]/20 border border-[#12b3a4]/40 text-[#2FE0CF] text-[10px] font-black">
            {t('lp.mock.headers')}
          </span>
        </div>

        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0A0A0A]">
          <MockRow kind="product" name={t('lp.mock.p1')} value="299" currency={currency} />
          {['S', 'M', 'L'].map((size) => (
            <MockRow
              key={size}
              kind="option"
              name={`${t('lp.mock.optName')} · ${size}`}
              value="299"
              currency={currency}
            />
          ))}
        </div>

        <ul className="mt-3.5 space-y-1.5">
          {['lp.mock.check1', 'lp.mock.check2', 'lp.mock.check3'].map((k) => (
            <li
              key={k}
              className="flex items-center gap-2 border border-white/10 px-2.5 py-1.5 rounded-lg bg-[#181818] text-xs font-semibold text-[#D4D4D4]"
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF6B50] text-[9px] font-black text-[#050505]">
                ✓
              </span>
              <span>{t(k)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* --------------------------------- landing -------------------------------- */

export interface LandingProps {
  onLoaded: (wb: SourceWorkbook) => void
  mode: Mode
  onPickMode: (m: Mode) => void
  platform: PlatformId
  onPlatformChange: (p: PlatformId) => void
  historyCount: number
  onOpenHistory: () => void
}

export default function Landing({
  onLoaded,
  platform,
  onPlatformChange,
  historyCount,
  onOpenHistory,
}: LandingProps) {
  const { t } = useI18n()

  // The hero is above the fold, so it plays on mount rather than on scroll;
  // the rest arrive as the user reaches them.
  const heroCopyRef = useReveal<HTMLDivElement>({ children: '> *', y: 28, stagger: 0.1, start: 'top bottom' })
  const heroCardRef = useReveal<HTMLDivElement>({ y: 32, delay: 0.15, duration: 0.8, start: 'top bottom' })
  const bentoRef = useReveal<HTMLDivElement>({ children: '> *', y: 36, stagger: 0.12 })
  const featHeadRef = useReveal<HTMLDivElement>({ children: '> *', y: 20, stagger: 0.08 })
  const featGridRef = useReveal<HTMLDivElement>({ children: '> *', y: 40, stagger: 0.14 })
  const footerRef = useReveal<HTMLElement>({ children: '> *', y: 24, stagger: 0.1 })

  return (
    <div className="pb-16 text-[#FFFFFF]">
      {/* =========================================================================
          HERO SECTION (Full Impact with Radial Gradient & Immediate Above-the-Fold Uploader)
          ========================================================================== */}
      {/* Fills the screen below the fixed header and centres itself in what is
          left, so the hero breathes instead of crowding the top.
          `100svh` (not `vh`) so a phone's collapsing URL bar cannot push the
          uploader off-screen. `min-h`, not `h`: on a short or zoomed viewport
          the content grows past it rather than being clipped. The 5rem / 6rem
          subtracted are the page container's own pt-20 / sm:pt-24 header gap. */}
      <section className="relative flex min-h-[calc(100svh-5rem)] flex-col justify-center pt-6 pb-12 sm:min-h-[calc(100svh-6rem)] sm:pt-10 sm:pb-16">
        {/* Subtle dark radial background */}
        <div
          className="pointer-events-none absolute inset-x-0 -top-10 h-[650px] -z-10"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 15%, rgba(45, 45, 45, 0.4) 0%, rgba(5, 5, 5, 0) 80%)',
          }}
        />

        {/* Slanted Floating Gaming/Editorial Badge */}
        <div className="mb-6 flex justify-start">
          <div className="floating-badge">
            <Zap className="size-4 fill-current" />
            <span className="uppercase text-xs font-black tracking-wider">
              {t('lp.badge')}
            </span>
          </div>
        </div>

        {/* Massive Editorial Headline & Hero Grid */}
        <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          {/* Left Column: Oversized Typography & Value Proposition */}
          <div ref={heroCopyRef}>
            <h1 className="editorial-title text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-[-0.05em] leading-[0.9]">
              {t('lp.hero.title1')}
              <span className="block text-[#FF6B50]">{t('lp.hero.title2')}</span>
            </h1>

            {/* Quick Benefits Pills */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#181818] px-3.5 py-1.5 text-xs font-bold text-[#FFFFFF]">
                <ShieldCheck className="size-4 text-[#12b3a4]" />
                <span>{t('lp.pill.local')}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#181818] px-3.5 py-1.5 text-xs font-bold text-[#FFFFFF]">
                <Sparkles className="size-4 text-[#FF6B50]" />
                <span>{t('lp.pill.smart')}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#181818] px-3.5 py-1.5 text-xs font-bold text-[#FFFFFF]">
                <FileSpreadsheet className="size-4 text-[#ffc531]" />
                <span>{t('lp.pill.instant')}</span>
              </span>
            </div>

            {/* Bottom Stack: Social proof avatars + direct email link */}
            <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              {/* Overlapping Grayscale Avatars */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3 rtl:space-x-reverse">
                  <div className="h-10 w-10 rounded-full border-2 border-[#050505] bg-[#222222] flex items-center justify-center font-bold text-xs text-[#FFFFFF] grayscale">
                    JD
                  </div>
                  <div className="h-10 w-10 rounded-full border-2 border-[#050505] bg-[#2a2a2a] flex items-center justify-center font-bold text-xs text-[#FFFFFF] grayscale">
                    AK
                  </div>
                  <div className="h-10 w-10 rounded-full border-2 border-[#050505] bg-[#333333] flex items-center justify-center font-bold text-xs text-[#FFFFFF] grayscale">
                    SL
                  </div>
                </div>
                <div className="leading-tight text-xs">
                  <p className="font-bold text-[#FFFFFF]">{t('lp.proof.count')}</p>
                  <p className="text-[#A3A3A3] text-[11px]">{t('lp.proof.sub')}</p>
                </div>
              </div>

              {/* Direct link with persistent bottom border */}
              <a
                href={LINKS.linkedin}
                target="_blank"
                rel="noreferrer"
                className="border-b border-white/20 hover:border-[#FF6B50] text-[#D4D4D4] hover:text-[#FF6B50] transition-colors pb-1 text-xs font-bold"
              >
                {t('lp.contact.link')}
              </a>
            </div>
          </div>

          {/* Right Column: Integrated Hero Converter Box (Above the Fold) */}
          <div ref={heroCardRef} className="relative">
            <div className="card p-5 sm:p-7 bg-[#111111] border border-white/15 rounded-3xl shadow-2xl backdrop-blur-xl">
              {/* Platform Selector Header */}
              <div className="flex items-center justify-between gap-3 mb-5 border-b border-white/10 pb-4">
                <span className="text-xs font-black text-[#FFFFFF] flex items-center gap-2">
                  <Package className="size-4 text-[#FF6B50]" />
                  <span>{t('lp.platform.label')}</span>
                </span>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#181818] border border-white/10">
                  {PLATFORMS.map((p) => {
                    const active = platform === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onPlatformChange(p.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                          active
                            ? 'bg-[#FF6B50] text-[#050505] shadow-md'
                            : 'text-[#D4D4D4] hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {t(p.nameKey)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* The Uploader Zone */}
              <Uploader onLoaded={onLoaded} compact showTips={false} />

              {/* Card Footer */}
              <div className="mt-4 pt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 text-xs font-bold">
                {historyCount > 0 ? (
                  <button
                    type="button"
                    onClick={onOpenHistory}
                    className="flex items-center gap-1.5 text-[#FF6B50] hover:underline"
                  >
                    <FolderArchive className="size-3.5" />
                    <span>{t('history.title')} ({historyCount})</span>
                  </button>
                ) : (
                  <span className="text-[#A3A3A3] text-[11px] font-medium">
                    {t('lp.uploader.formats')}
                  </span>
                )}

                <span className="flex items-center gap-1 text-[11px] text-[#A3A3A3] font-medium">
                  <Lock className="size-3" />
                  <span>{t('lp.uploader.privacy')}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          BENEFITS BENTO GRID (2-Column Spec)
          ========================================================================== */}
      <section className="py-12 border-t border-white/10">
        <div ref={bentoRef} className="grid gap-6 md:grid-cols-2">
          {/* Column 1: #111111 rounded-3xl card with oversized typography */}
          <div className="card p-8 sm:p-10 bg-[#111111] border border-white/10 rounded-3xl flex flex-col justify-between">
            <div>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[#D4D4D4] text-xs font-black uppercase tracking-wider inline-block mb-6">
                {t('lp.bento.speedTag')}
              </span>
              <h2 className="editorial-title text-4xl sm:text-5xl font-black text-white leading-[0.9]">
                {t('lp.bento.speedTitle1')}
                <span className="block text-[#A3A3A3]">{t('lp.bento.speedTitle2')}</span>
              </h2>
              <p className="mt-6 text-sm sm:text-base text-[#D4D4D4] font-medium leading-relaxed max-w-md">
                {t('lp.bento.speedBody')}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white font-mono">0.4s</p>
                <p className="text-xs text-[#A3A3A3] font-bold mt-1">{t('lp.bento.statTime')}</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-[#FF6B50] font-mono">100%</p>
                <p className="text-xs text-[#A3A3A3] font-bold mt-1">{t('lp.bento.statPrivacy')}</p>
              </div>
            </div>
          </div>

          {/* Column 2: Vibrant Gradient Card with Floating UI Mockup */}
          <div
            className="rounded-3xl p-8 sm:p-10 border border-white/15 relative overflow-hidden flex flex-col justify-between"
            style={{
              background:
                'linear-gradient(135deg, rgba(18, 179, 164, 0.25) 0%, rgba(17, 17, 17, 0.95) 60%, #111111 100%)',
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-[#12b3a4]/20 border border-[#12b3a4]/40 text-[#2FE0CF] text-xs font-black">
                  {t('lp.bento.structTag')}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
                {t('lp.bento.structTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-[#D4D4D4] font-medium mb-6">
                {t('lp.bento.structBody')}
              </p>
            </div>

            <div className="mt-2">
              <OutputMockup />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          STAGGERED WORK / FEATURE GALLERY (2-Column Staggered Spec)
          ========================================================================== */}
      <section className="py-12 border-t border-white/10">
        <div ref={featHeadRef} className="mb-8">
          <span className="text-[11px] font-black uppercase text-[#FF6B50] tracking-[0.2em] block mb-2">
            {t('lp.feat.sectionEyebrow')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {t('lp.feat.sectionTitle')}
          </h2>
        </div>

        <div ref={featGridRef} className="grid gap-8 md:grid-cols-2">
          {/* Project 1: Image Scraper Engine */}
          <div className="group">
            <div className="editorial-img-container mb-4 flex items-center justify-center p-8 bg-[#111111] border border-white/15">
              <div className="flex flex-col items-center justify-center text-center p-6">
                <div className="h-16 w-16 rounded-2xl bg-[#FF6B50]/15 border border-[#FF6B50]/35 flex items-center justify-center text-[#FF6B50] mb-4 transition-transform duration-500 group-hover:scale-110">
                  <Camera className="size-8" />
                </div>
                <h4 className="text-lg font-black text-white mb-2">
                  {t('lp.feat.scraperCard')}
                </h4>
                <p className="text-xs text-[#D4D4D4] font-medium max-w-sm">
                  {t('lp.feat.scraperBody')}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#A3A3A3] tracking-[0.2em] uppercase">
                  {t('lp.feat.autoTag')}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-1 group-hover:text-[#FF6B50] transition-colors">
                  {t('lp.feat.scraperTitle')}
                </h3>
              </div>
              <span className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center text-white group-hover:border-[#FF6B50] group-hover:text-[#FF6B50] transition-all">
                <ArrowUpRight className="size-5" />
              </span>
            </div>
          </div>

          {/* Project 2: Wepix Image Studio (Staggered mt-16 on md screens) */}
          <div className="group md:mt-16">
            <div className="editorial-img-container mb-4 flex items-center justify-center p-8 bg-[#111111] border border-white/15">
              <div className="flex flex-col items-center justify-center text-center p-6">
                <div className="h-16 w-16 rounded-2xl bg-[#12b3a4]/15 border border-[#12b3a4]/35 flex items-center justify-center text-[#12b3a4] mb-4 transition-transform duration-500 group-hover:scale-110">
                  <WepixLogo size={42} />
                </div>
                <h4 className="text-lg font-black text-white mb-2">
                  {t('lp.feat.wepixCard')}
                </h4>
                <p className="text-xs text-[#D4D4D4] font-medium max-w-sm">
                  {t('lp.feat.wepixBody')}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#A3A3A3] tracking-[0.2em] uppercase">
                  {t('lp.feat.ecoTag')}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-1 group-hover:text-[#12b3a4] transition-colors">
                  {t('lp.feat.wepixTitle')}
                </h3>
              </div>
              <a
                href={LINKS.wepix}
                target="_blank"
                rel="noreferrer"
                className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-[#12b3a4] hover:text-[#12b3a4] transition-all"
              >
                <ArrowUpRight className="size-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          IMPACT FOOTER (Typographic & 56px Circular Social Icons)
          ========================================================================== */}
      <footer ref={footerRef} className="mt-20 pt-12 border-t border-white/10">
        {/* Massive Editorial Typographic Block */}
        <div className="mb-12 overflow-hidden select-none">
          <div className="editorial-title text-6xl sm:text-8xl lg:text-9xl font-black text-[#3A3A3A] hover:text-[#4D4D4D] transition-colors tracking-[-0.05em] leading-[0.85] flex items-baseline">
            <span>MUZAWWID</span>
            <span className="text-[#FF6B50]">.</span>
          </div>
        </div>

        {/* Contact and Credits Row */}
        <div className="flex flex-wrap items-center justify-between gap-8 pt-6 border-t border-white/10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <AuthorCredit />
              <MadeBy />
            </div>
            <p className="text-xs text-[#A3A3A3]">
              {t('app.footer')} <span dir="ltr" className="text-[#D4D4D4]">s.salla.sa/import/products</span>
            </p>
          </div>

          {/* 56px Circular Social Icons */}
          <div className="flex items-center gap-3">
            <a
              href={LINKS.linkedin}
              target="_blank"
              rel="noreferrer"
              title="LinkedIn"
              className="circle-social-btn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.2a1.64 1.64 0 0 0-1.66 1.64c0 .9.74 1.64 1.66 1.64 1 0 1.66-.74 1.66-1.64 0-.9-.66-1.64-1.66-1.64Z" />
              </svg>
            </a>
            <a
              href={LINKS.github}
              target="_blank"
              rel="noreferrer"
              title="GitHub"
              className="circle-social-btn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
                <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
              </svg>
            </a>
            <a
              href={LINKS.portfolio}
              target="_blank"
              rel="noreferrer"
              title={t('links.portfolio')}
              aria-label={t('links.portfolio')}
              className="circle-social-btn"
            >
              <ExternalLink className="size-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
