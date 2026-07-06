import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import {
  buildSallaWorkbook,
  workbookToBlob,
  SALLA_HEADERS,
  SHEET_NAME,
  SECTION_LABEL,
  F,
  ROW_PRODUCT,
  ROW_OPTION,
} from './salla'

describe('Salla writer — schema invariants', () => {
  it('has exactly 40 headers with the required trailing space on the first', () => {
    expect(SALLA_HEADERS).toHaveLength(40)
    expect(SALLA_HEADERS[0]).toBe('النوع ')
    expect(SALLA_HEADERS[0].endsWith(' ')).toBe(true)
  })

  it('produces a workbook with exactly ONE sheet, correctly named', () => {
    const wb = buildSallaWorkbook([])
    expect(wb.SheetNames).toEqual([SHEET_NAME])
    expect(Object.keys(wb.Sheets)).toEqual([SHEET_NAME])
  })

  it('places the section label in A1 and the 40 headers in row 2', () => {
    const wb = buildSallaWorkbook([])
    const ws = wb.Sheets[SHEET_NAME]
    const aoa = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' })
    expect(aoa[0][0]).toBe(SECTION_LABEL)
    expect(aoa[1]).toEqual([...SALLA_HEADERS])
    expect(aoa[1]).toHaveLength(40)
  })

  it('writes product + option rows starting at row 3 in order', () => {
    const rows = [
      { [F.type]: ROW_PRODUCT, [F.name]: 'قميص', [F.price]: '100', [F.weight]: '1', [F.weightUnit]: 'kg' },
      { [F.type]: ROW_OPTION, [F.sku]: 'SH-XL', [F.weight]: '1', [F.weightUnit]: 'kg' },
    ]
    const wb = buildSallaWorkbook(rows)
    const ws = wb.Sheets[SHEET_NAME]
    const aoa = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' })
    // row index 2 = first data row
    expect(aoa[2][0]).toBe(ROW_PRODUCT)
    expect(aoa[2][1]).toBe('قميص')
    expect(aoa[3][0]).toBe(ROW_OPTION)
    // every data row must have all 40 columns
    expect(aoa[2]).toHaveLength(40)
    expect(aoa[3]).toHaveLength(40)
  })

  it('round-trips through a real xlsx blob and still has one sheet', async () => {
    const wb = buildSallaWorkbook([{ [F.type]: ROW_PRODUCT, [F.name]: 'x', [F.weight]: '1' }])
    const blob = workbookToBlob(wb)
    const buf = await blob.arrayBuffer()
    const reread = XLSX.read(buf, { type: 'array' })
    expect(reread.SheetNames).toEqual([SHEET_NAME])
  })
})
