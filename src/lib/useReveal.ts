import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Scroll-triggered entrance animations.
 *
 * Two rules shape everything here:
 *
 * 1. **The hidden state lives in JS, never in CSS.** `gsap.from()` sets the
 *    offset itself at run time, so markup that never gets animated — reduced
 *    motion, a GSAP load failure, a trigger that never fires — still renders
 *    at full opacity. A `.reveal { opacity: 0 }` class would leave the page
 *    permanently blank in exactly those cases.
 * 2. **Animate once.** These mark arrival, not scroll position, so they do not
 *    replay when the user scrolls back up.
 */

/**
 * `querySelectorAll('> *')` throws — a combinator cannot start a selector. The
 * relative form needs an explicit `:scope`, so a caller-friendly `'> *'` is
 * rewritten to `':scope > *'` here rather than at every call site.
 */
export function scopedSelector(selector: string): string {
  const trimmed = selector.trim()
  return /^[>+~]/.test(trimmed) ? `:scope ${trimmed}` : trimmed
}

/** Honours the OS "reduce motion" setting, as the rest of the design system does. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  )
}

export interface RevealOptions {
  /**
   * Stagger the container's matching descendants instead of the container
   * itself — e.g. `'> *'` for direct children, or `'.card'`. A leading
   * combinator is scoped for you (see `scopedSelector`).
   */
  children?: string
  /** Travel distance in px. Positive `y` rises into place. */
  y?: number
  /**
   * Horizontal travel. Positive means "from the trailing edge", flipped under
   * `dir="rtl"` so the motion follows the reading direction in both languages.
   */
  x?: number
  duration?: number
  stagger?: number
  delay?: number
  /** ScrollTrigger `start`. The default fires a little before the top edge. */
  start?: string
  /** Skip the animation entirely (e.g. while the section is not rendered). */
  disabled?: boolean
  /**
   * Change this to replay the animation on an element that stays mounted —
   * e.g. the active step or tab, whose content swaps without a remount.
   */
  replayKey?: string | number
}

/**
 * Returns a ref to attach to the element that should animate in.
 *
 * ```tsx
 * const ref = useReveal<HTMLDivElement>({ children: '> *', stagger: 0.08 })
 * return <div ref={ref}>…</div>
 * ```
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {},
) {
  const ref = useRef<T>(null)

  const {
    children,
    y = 24,
    x = 0,
    duration = 0.7,
    stagger = 0.09,
    delay = 0,
    start = 'top 88%',
    disabled = false,
    replayKey,
  } = options

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || disabled || prefersReducedMotion()) return

    // A context scopes every tween and ScrollTrigger created inside it, so one
    // `revert()` cleans them all up AND restores the inline styles GSAP wrote.
    // Without it React 18's double-invoked effects leave orphaned triggers.
    let ctx: gsap.Context | undefined
    // A decoration must never take the page down with it: a throw inside a
    // layout effect unmounts the whole subtree, which is how a bad selector
    // once blanked the entire landing page. Degrade to "no animation".
    try {
      ctx = gsap.context(() => {
        const targets = children
          ? gsap.utils.toArray<HTMLElement>(scopedSelector(children), el)
          : el
        if (Array.isArray(targets) && targets.length === 0) return

        // `x` is authored as "from the trailing edge"; under RTL that is the
        // opposite screen direction.
        const rtl = document.documentElement.dir === 'rtl'
        const xFrom = rtl ? -x : x

        const tween = gsap.from(targets, {
          opacity: 0,
          y,
          x: xFrom,
          duration,
          delay,
          ease: 'power3.out',
          stagger: children ? stagger : 0,
          // Clear the inline transform afterwards so it cannot fight a CSS
          // hover transform (`.lift`, `hover:scale-105`) once settled.
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: el,
            start,
            once: true,
          },
        })

        // Safety net. `gsap.from` applies the hidden state immediately, so an
        // element whose trigger point sits past the furthest the page can
        // actually scroll would stay invisible forever — a short page whose last
        // section never reaches `start`. If the trigger is unreachable, jump the
        // tween to its end state (which is simply "visible").
        requestAnimationFrame(() => {
          const st = tween.scrollTrigger
          if (st && st.start > ScrollTrigger.maxScroll(window)) tween.progress(1)
        })
      }, el)
    } catch (err) {
      console.error('useReveal: entrance animation skipped', err)
      ctx?.revert()
      return
    }

    return () => ctx?.revert()
  }, [children, y, x, duration, stagger, delay, start, disabled, replayKey])

  return ref
}
