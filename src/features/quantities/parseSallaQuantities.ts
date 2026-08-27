import * as XLSX from 'xlsx'
import { QUANTITIES_SHEET_NAME, QUANTITY_HEADERS } from './schema'
import {
  applyStockRule,
  LIMITED,
  ROW_OPTION,
  ROW_PRODUCT,
  UNLIMITED,
  type QuantityRow,
} from './types'

/**
 * Read a quantities sheet the merchant exported from Salla.
 *
 * `reader.ts` cannot be reused here: it treats the first row as the header,
 * and this file's first row is the band labels («بيانات المنتج» / «الكميات»)
 * with the real header on row 2.
 *
 * Everything is read with `raw: false` so the `No.` ids arrive as the digits
 * Salla wrote. They are the one thing in this file we must never alter.
 */

export class NotAQuantitiesSheet extends Error {
  constructor() {
    super('not a Salla quantities sheet')
    this.name = 'NotAQuantitiesSheet'
  }
}

/** Row 2's first cell — the marker we locate the header by. */
const ID_HEADER = QUANTITY_HEADERS[0]

function cell(row: string[], index: number): string {
  return String(row[index] ?? '').trim()
}

/**
 * Rows from the already-decoded grid.
 *
 * The header is found rather than assumed at row 2: a merchant who deletes the
 * banner row, or a future Salla tweak, should not break the import.
 */
export function parseQuantityRows(aoa: string[][]): QuantityRow[] {
  const headerAt = aoa.findIndex((row) => cell(row, 0) === ID_HEADER)
  if (headerAt === -1) throw new NotAQuantitiesSheet()

  const rows: QuantityRow[] = []
  for (const raw of aoa.slice(headerAt + 1)) {
    const name = cell(raw, 2)
    const type = cell(raw, 1)
    // A row with neither a name nor a type is spacing, not data.
    if (!name && !type) continue

    const quantity = cell(raw, 5)
    const parsed = Number(quantity)
    rows.push(
      applyStockRule({
        no: cell(raw, 0),
        type: type === ROW_OPTION ? ROW_OPTION : ROW_PRODUCT,
        name,
        sku: cell(raw, 3),
        // Salla's own export leaves this blank rather than writing «لا», so a
        // blank cell reads as limited — which is what its numbers imply.
        unlimited: cell(raw, 4) === UNLIMITED ? UNLIMITED : LIMITED,
        quantity: quantity === '' || Number.isNaN(parsed) ? '' : parsed,
      }),
    )
  }
  return rows
}

/** Read the uploaded .xlsx. Throws `NotAQuantitiesSheet` if it is another file. */
export async function readQuantitiesFile(file: File): Promise<QuantityRow[]> {
  const wb = XLSX.read(await file.arrayBuffer(), {
    type: 'array',
    cellDates: false,
    raw: false,
    codepage: 65001,
  })

  // Prefer Salla's own sheet name, but accept a renamed single sheet too.
  const name = wb.SheetNames.includes(QUANTITIES_SHEET_NAME)
    ? QUANTITIES_SHEET_NAME
    : wb.SheetNames[0]
  if (!name) throw new NotAQuantitiesSheet()

  const aoa = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[name], {
    header: 1,
    defval: '',
    blankrows: false,
    raw: false,
  })
  return parseQuantityRows(aoa)
}
