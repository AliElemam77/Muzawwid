import type { MappingConfig, HistoryItem } from './types'
import type { SourceSheet } from './reader'

const STORAGE_KEY = 'sheet-to-salla:history'
const MAX = 20

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((h) => h && typeof h.id === 'string' && h.config)
      .slice(0, MAX)
  } catch {
    return []
  }
}

function writeAll(items: HistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX)))
}

export function saveHistory(name: string, config: MappingConfig, sheetName?: string, sheetSnapshot?: SourceSheet): HistoryItem[] {
  const items = loadHistory()
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const ts = new Date().toISOString()
  const entry: HistoryItem = { id, name, config, ts, sheetName, sheet: sheetSnapshot }
  items.unshift(entry)
  writeAll(items)
  return items
}

export function deleteHistory(id: string): HistoryItem[] {
  const items = loadHistory().filter((h) => h.id !== id)
  writeAll(items)
  return items
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}
