import type { ComponentType } from 'react'
import { SallaLogo, ZidLogo, WooLogo, ShopifyLogo } from '../components/platformLogos'

export type PlatformId = 'salla' | 'zid' | 'woocommerce' | 'shopify'

export interface Platform {
  id: PlatformId
  /** i18n key for the display name. */
  nameKey: string
  /** Brand accent colour used for the selected ring. */
  color: string
  Logo: ComponentType<{ size?: number }>
  /** Only 'salla' has a real exporter today; the rest are placeholders. */
  ready: boolean
}

export const PLATFORMS: Platform[] = [
  { id: 'salla', nameKey: 'platform.salla', color: '#0e9f7e', Logo: SallaLogo, ready: true },
  { id: 'zid', nameKey: 'platform.zid', color: '#4c2a86', Logo: ZidLogo, ready: false },
  { id: 'woocommerce', nameKey: 'platform.woo', color: '#7f54b3', Logo: WooLogo, ready: false },
  { id: 'shopify', nameKey: 'platform.shopify', color: '#5e8e3e', Logo: ShopifyLogo, ready: false },
]

const STORAGE_KEY = 'muzawwid:platform'

export function loadPlatform(): PlatformId {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return PLATFORMS.some((p) => p.id === v) ? (v as PlatformId) : 'salla'
  } catch {
    return 'salla'
  }
}

export function savePlatform(id: PlatformId): PlatformId {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
  return id
}
