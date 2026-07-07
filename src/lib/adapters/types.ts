import type * as XLSX from 'xlsx'
import type { Product } from '../product'
import type { Validation } from '../build'
import type { PlatformId } from '../platforms'

/**
 * An export target. Each adapter serializes the canonical Product[] into its
 * platform's exact spreadsheet, and validates the same products. Adapters are
 * independent — none reads or reuses another's format.
 */
export interface ExportAdapter {
  id: PlatformId
  /** Download file name for this platform's export. */
  fileName: string
  serialize(products: Product[]): XLSX.WorkBook
  validate(products: Product[]): Validation
}
