import type { MappingConfig, Preset } from './types'

const STORAGE_KEY = 'sheet-to-salla:presets'

/** Load all saved presets from localStorage (safe: never throws). */
export function loadPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (p): p is Preset => p && typeof p.name === 'string' && p.config,
    )
  } catch {
    return []
  }
}

function writeAll(presets: Preset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

/** Save (or overwrite by name) a preset and return the updated list. */
export function savePreset(name: string, config: MappingConfig): Preset[] {
  const trimmed = name.trim()
  if (!trimmed) return loadPresets()
  const presets = loadPresets().filter((p) => p.name !== trimmed)
  presets.push({ name: trimmed, config })
  writeAll(presets)
  return presets
}

/** Delete a preset by name and return the updated list. */
export function deletePreset(name: string): Preset[] {
  const presets = loadPresets().filter((p) => p.name !== name)
  writeAll(presets)
  return presets
}
