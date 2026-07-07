import type { PlatformId } from '../platforms'
import type { ExportAdapter } from './types'
import { zidAdapter } from './zid'

export type { ExportAdapter } from './types'

/**
 * Canonical-model export adapters, keyed by platform. Salla keeps its own
 * dedicated (sheet + config) pipeline for backwards compatibility and is not
 * routed through here; new platforms register as canonical adapters.
 */
export const ADAPTERS: Partial<Record<PlatformId, ExportAdapter>> = {
  zid: zidAdapter,
}

export function getAdapter(id: PlatformId): ExportAdapter | undefined {
  return ADAPTERS[id]
}
