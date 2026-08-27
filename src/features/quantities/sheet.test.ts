import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import styled from 'xlsx-js-style'
import { strFromU8, unzipSync } from 'fflate'
import {
  buildQuantitiesWorkbook,
  freezeHeader,
  quantitiesToBlob,
  quantitiesToBytes,
} from './exportQuantitiesXlsx'
import { NotAQuantitiesSheet, parseQuantityRows, readQuantitiesFile } from './parseSallaQuantities'
import { mergeWithSalla } from './mergeWithSalla'
import { COLUMN_WIDTHS, QUANTITIES_SHEET_NAME, QUANTITY_HEADERS } from './schema'
import { LIMITED, UNLIMITED, type QuantityRow } from './types'

const product = (no: string, name: string): QuantityRow => ({
  no,
  type: 'منتج',
  name,
  sku: '',
  unlimited: 'نعم',
  quantity: '',
})

const option = (no: string, name: string, quantity: number | '' = 0): QuantityRow => ({
  no,
  type: 'خيار',
  name,
  sku: '',
  unlimited: LIMITED,
  quantity,
})

/**
 * Mirrors a real Salla export: 93 plain products, then products that each
 * carry their option rows immediately beneath them. Built here rather than
 * committed as a fixture — the real file is a live store's catalogue.
 */
function sallaExport(): QuantityRow[] {
  const rows: QuantityRow[] = []
  let id = 1000000000
  for (let i = 0; i < 3; i++) rows.push(product(String(id++), `S${300 + i} عباية مع طرحة دبل كلوش`))
  rows.push(product(String(id++), 'تنورة أفلين بخامة تويد'))
  for (const size of ['42', '44', '46']) {
    rows.push(option(String(id++), `تنورة أفلين بخامة تويد - 40/${size}`))
  }
  return rows
}

/**
 * Round-trip helper. Writing goes through the PRODUCTION serializer — writing
 * with plain `xlsx` here would drop every style and quietly pass.
 */
async function writeAndRead(rows: QuantityRow[]) {
  const back = XLSX.read(await quantitiesToBytes(rows), { type: 'array', raw: false })
  const ws = back.Sheets[back.SheetNames[0]]
  return {
    wb: back,
    ws,
    aoa: XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '', raw: false }),
  }
}

describe('buildQuantitiesWorkbook', () => {
  it('writes exactly one sheet, under Salla’s name', async () => {
    const { wb } = await writeAndRead(sallaExport())
    expect(wb.SheetNames).toEqual([QUANTITIES_SHEET_NAME])
  })

  it('lays out the two banner rows and the six headers', async () => {
    const { aoa } = await writeAndRead([product('1', 'قميص')])
    expect(aoa[0][0]).toBe('بيانات المنتج')
    expect(aoa[0][5]).toBe('الكميات')
    expect(aoa[1]).toEqual([...QUANTITY_HEADERS])
  })

  it('merges A1:E1 so the banner spans the product columns', async () => {
    const { ws } = await writeAndRead([product('1', 'قميص')])
    expect(ws['!merges']).toEqual([{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }])
  })

  it('keeps Salla’s column widths', async () => {
    // Asserted against the written XML, not a re-read: SheetJS only parses
    // `!cols` back when asked for styles, so a round-trip would prove nothing.
    const wb = buildQuantitiesWorkbook([product('1', 'قميص')])
    expect(wb.Sheets[QUANTITIES_SHEET_NAME]['!cols']?.map((c) => c?.width)).toEqual(COLUMN_WIDTHS)

    const xml = sheetXml(await quantitiesToBytes([product('1', 'قميص')]))
    for (const width of COLUMN_WIDTHS) expect(xml).toContain(`width="${width}"`)
  })

  it('paints the header turquoise with white bold text', async () => {
    const styles = strFromU8(unzipSync(await quantitiesToBytes([product('1', 'قميص')]))['xl/styles.xml'])
    expect(styles).toContain('FF5DD5C4') // Salla's turquoise
    expect(styles).toContain('FFFFFFFF') // white header text
    expect(styles).toContain('val="14"') // header font size
  })

  it('keeps the header rows 30pt tall', async () => {
    const xml = sheetXml(await quantitiesToBytes([product('1', 'قميص')]))
    expect(xml).toMatch(/<row r="1"[^>]*ht="30"/)
    expect(xml).toMatch(/<row r="2"[^>]*ht="30"/)
  })

  it('marks the workbook right-to-left', () => {
    const wb = buildQuantitiesWorkbook([product('1', 'قميص')])
    expect(wb.Workbook?.Views?.[0]).toMatchObject({ RTL: true })
  })

  it('starts the data on row 3 and keeps every row', async () => {
    const rows = sallaExport()
    const { aoa } = await writeAndRead(rows)
    expect(aoa).toHaveLength(rows.length + 2)
    expect(aoa[2][2]).toBe(rows[0].name)
  })

  it('round-trips ids without losing a digit', async () => {
    const { aoa } = await writeAndRead([product('1199592459', 'عباية'), option('1309327095', 'عباية - 40/42')])
    expect(aoa[2][0]).toBe('1199592459')
    expect(aoa[3][0]).toBe('1309327095')
  })

  it('leaves the quantity cell out when a row is unlimited', async () => {
    const { aoa } = await writeAndRead([product('1', 'قميص')])
    expect(aoa[2][4]).toBe(UNLIMITED)
    expect(aoa[2][5] ?? '').toBe('')
  })

  it('writes a quantity on PRODUCT rows too, not only variants', async () => {
    // The whole point of the fix: stock is controllable on every row.
    const limited: QuantityRow = { ...product('1', 'قميص'), unlimited: LIMITED, quantity: 5 }
    const { aoa } = await writeAndRead([limited])
    expect(aoa[2][4]).toBe(LIMITED)
    expect(aoa[2][5]).toBe('5')
  })

  it('writes the quantity on option rows with «لا»', async () => {
    const { aoa } = await writeAndRead([option('2', 'قميص - S', 7)])
    expect(aoa[2][4]).toBe(LIMITED)
    expect(aoa[2][5]).toBe('7')
  })

  it('keeps a zero quantity rather than dropping the cell', async () => {
    const { aoa } = await writeAndRead([option('2', 'قميص - S', 0)])
    expect(aoa[2][5]).toBe('0')
  })

  it('handles an empty catalogue without producing a broken sheet', async () => {
    const { aoa } = await writeAndRead([])
    expect(aoa[1]).toEqual([...QUANTITY_HEADERS])
  })
})

describe('freezeHeader', () => {
  /** The serializer's output BEFORE the pane is spliced in. */
  function unfrozen(rows: QuantityRow[]): Uint8Array {
    const wb = buildQuantitiesWorkbook(rows)
    return new Uint8Array(styled.write(wb, { bookType: 'xlsx', type: 'array', bookSST: true }))
  }

  it('adds the frozen pane xlsx-js-style cannot write', async () => {
    const raw = unfrozen([product('1', 'قميص')])
    expect(sheetXml(raw)).not.toContain('<pane')

    const xml = sheetXml(freezeHeader(raw))
    expect(xml).toContain('ySplit="2"')
    expect(xml).toContain('topLeftCell="A3"')
    expect(xml).toContain('state="frozen"')
  })

  it('keeps the right-to-left flag it splices around', async () => {
    expect(sheetXml(freezeHeader(unfrozen([product('1', 'قميص')])))).toContain('rightToLeft')
  })

  it('still produces a readable workbook afterwards', async () => {
    const back = XLSX.read(await quantitiesToBytes([product('1199592459', 'عباية')]), {
      type: 'array',
      raw: false,
    })
    const aoa = XLSX.utils.sheet_to_json<string[]>(back.Sheets[back.SheetNames[0]], {
      header: 1,
      defval: '',
      raw: false,
    })
    expect(back.SheetNames).toEqual([QUANTITIES_SHEET_NAME])
    expect(aoa[2][0]).toBe('1199592459')
  })

  it('returns the file untouched when it is not what we expect', () => {
    const junk = new Uint8Array([1, 2, 3, 4])
    expect(freezeHeader(junk)).toBe(junk)
  })
})

function sheetXml(zipped: Uint8Array): string {
  const files = unzipSync(zipped)
  const path = Object.keys(files).find((p) => /sheet1\.xml$/i.test(p))!
  return strFromU8(files[path])
}

// --- Reading a Salla export -------------------------------------------------

const HEADER_AOA = [
  ['بيانات المنتج', '', '', '', '', 'الكميات'],
  [...QUANTITY_HEADERS],
]

describe('parseQuantityRows', () => {
  it('reads a product row', () => {
    const rows = parseQuantityRows([
      ...HEADER_AOA,
      ['1199592459', 'منتج', 'S335 عباية', '', 'نعم', ''],
    ])
    expect(rows).toEqual([
      { no: '1199592459', type: 'منتج', name: 'S335 عباية', sku: '', unlimited: UNLIMITED, quantity: '' },
    ])
  })

  it('reads an option row with its quantity', () => {
    const rows = parseQuantityRows([
      ...HEADER_AOA,
      ['1309327095', 'خيار', 'تنورة - 40/42', '', '', '0'],
    ])
    expect(rows[0]).toMatchObject({ type: 'خيار', quantity: 0, unlimited: LIMITED })
  })

  it('keeps ids as text so no digit is lost', () => {
    const rows = parseQuantityRows([...HEADER_AOA, ['1199592459', 'منتج', 'عباية', '', 'نعم', '']])
    expect(rows[0].no).toBe('1199592459')
    expect(typeof rows[0].no).toBe('string')
  })

  it('finds the header even when the banner row was deleted', () => {
    const rows = parseQuantityRows([[...QUANTITY_HEADERS], ['7', 'منتج', 'قميص', '', 'نعم', '']])
    expect(rows).toHaveLength(1)
  })

  it('skips spacer rows', () => {
    const rows = parseQuantityRows([...HEADER_AOA, ['', '', '', '', '', ''], ['1', 'منتج', 'قميص', '', 'نعم', '']])
    expect(rows).toHaveLength(1)
  })

  it('never yields NaN for an unreadable quantity', () => {
    // The row is limited, so the stock rule settles it at 0 rather than blank.
    const rows = parseQuantityRows([...HEADER_AOA, ['1', 'خيار', 'قميص - S', '', 'لا', 'كتير']])
    expect(rows[0].quantity).toBe(0)
  })

  it('blanks the quantity on a row Salla marked unlimited', () => {
    const rows = parseQuantityRows([...HEADER_AOA, ['1', 'منتج', 'قميص', '', 'نعم', '9']])
    expect(rows[0]).toMatchObject({ unlimited: UNLIMITED, quantity: '' })
  })

  it('rejects a file that is not a quantities sheet', () => {
    expect(() => parseQuantityRows([['اسم المنتج', 'السعر'], ['قميص', '10']])).toThrow(
      NotAQuantitiesSheet,
    )
  })
})

describe('round trip through a real .xlsx', () => {
  it('writes a sheet and reads back the same rows', async () => {
    const rows = sallaExport()
    const blob = await quantitiesToBlob(rows)
    const file = new File([await blob.arrayBuffer()], 'q.xlsx')
    const back = await readQuantitiesFile(file)

    expect(back).toHaveLength(rows.length)
    expect(back.map((r) => r.no)).toEqual(rows.map((r) => r.no))
    expect(back.map((r) => r.name)).toEqual(rows.map((r) => r.name))
    expect(back.map((r) => r.type)).toEqual(rows.map((r) => r.type))
  })
})

// --- Merging ----------------------------------------------------------------

describe('mergeWithSalla', () => {
  const salla = [product('111', 'قميص'), option('222', 'قميص - S'), option('333', 'قميص - M')]

  it('fills quantities and keeps every id byte for byte', () => {
    const { rows, report } = mergeWithSalla(salla, [
      option('', 'قميص - S', 12),
      option('', 'قميص - M', 5),
    ])
    expect(rows.map((r) => r.no)).toEqual(['111', '222', '333'])
    expect(rows[1].quantity).toBe(12)
    expect(rows[2].quantity).toBe(5)
    expect(report.matched).toBe(2)
  })

  it('matches across Arabic spelling differences', () => {
    const store = [option('9', 'بلوزة هاوس أوف يمينة - 40')]
    const { rows, report } = mergeWithSalla(store, [option('', 'بلوزه هاوس اوف يمينه - 40', 3)])
    expect(rows[0].quantity).toBe(3)
    expect(report.matched).toBe(1)
  })

  it('leaves an unmatched Salla row exactly as it was, and reports it', () => {
    const { rows, report } = mergeWithSalla(salla, [option('', 'قميص - S', 12)])
    expect(rows[2]).toEqual(salla[2])
    expect(report.unmatched.map((r) => r.name)).toEqual(['قميص', 'قميص - M'])
  })

  it('never blanks an existing quantity when the merchant left the cell empty', () => {
    const store = [option('222', 'قميص - S', 99)]
    const { rows } = mergeWithSalla(store, [option('', 'قميص - S', '')])
    expect(rows[0].quantity).toBe(99)
  })

  it('reports rows that do not exist in the store yet', () => {
    const { report } = mergeWithSalla(salla, [option('', 'قميص - XL', 4)])
    expect(report.missingInStore).toEqual(['قميص - XL'])
  })

  it('clears "unlimited" on any row it gives a number to', () => {
    const { rows } = mergeWithSalla([product('111', 'قميص')], [product('', 'قميص')].map((r) => ({ ...r, quantity: 8 })))
    expect(rows[0].quantity).toBe(8)
    expect(rows[0].unlimited).toBe(LIMITED)
  })

  it('takes the first of a duplicated name rather than silently the last', () => {
    const { rows } = mergeWithSalla(
      [option('222', 'قميص - S')],
      [option('', 'قميص - S', 1), option('', 'قميص - S', 99)],
    )
    expect(rows[0].quantity).toBe(1)
  })

  it('returns the sheet untouched when nothing is supplied', () => {
    const { rows, report } = mergeWithSalla(salla, [])
    expect(rows).toEqual(salla)
    expect(report.matched).toBe(0)
    expect(report.missingInStore).toEqual([])
  })
})
