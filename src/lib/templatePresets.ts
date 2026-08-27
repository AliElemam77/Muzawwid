import { F } from './salla'
import type { TemplateConfig } from './template'

const STORAGE_KEY = 'sheet-to-salla:templates'

/**
 * Ready-made description skeletons — deliberately generic, so they work on any
 * product sheet. They reference only fields that ALWAYS exist in the Salla
 * mapping (name / price / brand / category); a line whose placeholder resolves
 * empty removes itself at render time, so an unmapped brand simply disappears
 * instead of leaving a stub behind.
 *
 * These are starting points, not the product: the user edits from here.
 */
export interface TemplateStarter {
  /** i18n key for the card label. */
  labelKey: string
  html: string
}

export const TEMPLATE_STARTERS: TemplateStarter[] = [
  {
    labelKey: 'tpl.starter.simple',
    html:
      `<p><strong>{{${F.name}}}</strong></p>` +
      `<p>{{${F.description}}}</p>` +
      `<ul><li>الماركة: {{${F.brand}}}</li><li>التصنيف: {{${F.category}}}</li></ul>`,
  },
  {
    labelKey: 'tpl.starter.specs',
    html:
      `<h3>{{${F.name}}}</h3>` +
      `<p>{{${F.description}}}</p>` +
      `<h3>المواصفات</h3>` +
      `<ul><li>الماركة: {{${F.brand}}}</li>` +
      `<li>الوزن: {{${F.weight}}} {{${F.weightUnit}}}</li>` +
      `<li>الباركود: {{${F.barcode}}}</li></ul>`,
  },
  {
    labelKey: 'tpl.starter.marketing',
    html:
      `<p><strong>{{${F.name}}}</strong> — {{${F.promoTitle}}}</p>` +
      `<p>{{${F.description}}}</p>` +
      `<p><strong>السعر: {{${F.price}}} ر.س</strong></p>` +
      `<ul><li>شحن سريع لجميع مناطق المملكة</li>` +
      `<li>ضمان الاستبدال والاسترجاع</li></ul>`,
  },
]

/** A description template the user saved to reuse across files. */
export interface SavedTemplate {
  name: string
  html: string
}

/** Persisted template list — never throws, a corrupt store reads as empty. */
export function loadTemplates(): SavedTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((t) => t && typeof t.name === 'string' && typeof t.html === 'string')
      .map((t) => ({ name: String(t.name), html: String(t.html) }))
  } catch {
    return []
  }
}

function write(list: SavedTemplate[]): SavedTemplate[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* quota / private mode — the in-memory list still works this session */
  }
  return list
}

/** Save under `name`, replacing a template of the same name. */
export function saveTemplate(name: string, html: string): SavedTemplate[] {
  const clean = name.trim()
  if (!clean) return loadTemplates()
  const rest = loadTemplates().filter((t) => t.name !== clean)
  return write([...rest, { name: clean, html }])
}

export function deleteTemplate(name: string): SavedTemplate[] {
  return write(loadTemplates().filter((t) => t.name !== name))
}

/** Config for a freshly enabled template — starts from the simplest starter. */
export function starterConfig(): TemplateConfig {
  return { enabled: true, html: TEMPLATE_STARTERS[0].html }
}
