import type * as XLSX from 'xlsx'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import {
  BODY_FONT_SIZE,
  COLUMN_WIDTHS,
  FROZEN_ROWS,
  HEADER_FILL,
  HEADER_FONT_COLOR,
  HEADER_FONT_SIZE,
  HEADER_ROW_HEIGHT,
  QUANTITIES_LABEL,
  QUANTITIES_SHEET_NAME,
  QUANTITY_HEADERS,
  SECTION_LABEL,
  TEXT_COLUMNS,
} from './schema'
import type { QuantityRow } from './types'

/**
 * Write the quantities workbook.
 *
 * Serializing needs `xlsx-js-style`, not the plain `xlsx` the rest of the app
 * uses: the community SheetJS build drops cell styles on write, which would
 * lose the turquoise header entirely. That package ships as a non-tree-shakable
 * UMD bundle and costs ~200 KB gzipped, so it is loaded ON DEMAND — a merchant
 * who never touches quantities never downloads it.
 *
 * It cannot write frozen panes either (no `xSplit`/`ySplit`/`topLeftCell`
 * anywhere in its source), so that one attribute is patched into the finished
 * file afterwards — see `freezeHeader` at the bottom.
 */

type Cell = { v: string | number; t: 's' | 'n'; s?: Record<string, unknown>; z?: string }

const headerStyle = {
  font: { bold: true, sz: HEADER_FONT_SIZE, color: { rgb: HEADER_FONT_COLOR }, name: 'Calibri' },
  fill: { patternType: 'solid', fgColor: { rgb: HEADER_FILL } },
  alignment: { horizontal: 'center', vertical: 'center' },
}

const bodyStyle = {
  font: { sz: BODY_FONT_SIZE, color: { rgb: 'FF000000' }, name: 'Calibri' },
}

/**
 * Text cell. `column` decides whether it is tagged `@`, matching which columns
 * Salla formats as text — it is what stops Excel reading «40/42» as a date.
 */
function text(value: string, style: Record<string, unknown>, column = -1): Cell {
  const cell: Cell = { v: value, t: 's', s: style }
  if (column === -1 || TEXT_COLUMNS[column]) cell.z = '@'
  return cell
}

function number(value: number, style: Record<string, unknown>): Cell {
  return { v: value, t: 'n', s: style }
}

/**
 * Salla writes the id as a plain number, so we do too. Ten digits is far
 * inside the range a float represents exactly, so nothing is lost — but a
 * non-numeric id (never seen, cheap to allow) still round-trips as text.
 */
function idCell(no: string): Cell | null {
  const value = no.trim()
  if (!value) return null
  return /^\d+$/.test(value)
    ? number(Number(value), bodyStyle)
    : text(value, bodyStyle)
}

export function buildQuantitiesWorkbook(rows: QuantityRow[]): XLSX.WorkBook {
  const ws: XLSX.WorkSheet = {}

  // Row 1: the two band labels. B1..E1 stay empty but must still be styled,
  // otherwise the merge shows a half-painted turquoise strip.
  ws.A1 = text(SECTION_LABEL, headerStyle)
  for (const col of ['B', 'C', 'D', 'E']) ws[`${col}1`] = text('', headerStyle)
  ws.F1 = text(QUANTITIES_LABEL, headerStyle)

  // Row 2: the six headers.
  QUANTITY_HEADERS.forEach((header, i) => {
    ws[`${colLetter(i)}2`] = text(header, headerStyle)
  })

  rows.forEach((row, i) => {
    const r = i + 3
    const id = idCell(row.no)
    if (id) ws[`A${r}`] = id
    ws[`B${r}`] = text(row.type, bodyStyle, 1)
    ws[`C${r}`] = text(row.name, bodyStyle, 2)
    if (row.sku) ws[`D${r}`] = text(row.sku, bodyStyle, 3)
    ws[`E${r}`] = text(row.unlimited, bodyStyle, 4)
    // The rule, on every row alike: unlimited rows carry no number, so the
    // cell is left out rather than written blank — as Salla's export does.
    if (row.quantity !== '') ws[`F${r}`] = number(Number(row.quantity), bodyStyle)
  })

  const lastRow = Math.max(2, rows.length + 2)
  ws['!ref'] = `A1:F${lastRow}`
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }]
  // `width` — Excel's own unit — not `wch`: SheetJS pads a character count
  // into a slightly different number, and these came off Salla's file exact.
  ws['!cols'] = COLUMN_WIDTHS.map((width) => ({ width, customWidth: 1 }))
  ws['!rows'] = [{ hpt: HEADER_ROW_HEIGHT }, { hpt: HEADER_ROW_HEIGHT }]

  // Assembled literally rather than through `XLSX.utils`, so building the
  // workbook stays synchronous and needs no library at all — only writing it
  // out does. The merchant reads this in Arabic, hence RTL.
  return {
    SheetNames: [QUANTITIES_SHEET_NAME],
    Sheets: { [QUANTITIES_SHEET_NAME]: ws },
    Workbook: { Views: [{ RTL: true }] },
  }
}

function colLetter(index: number): string {
  return String.fromCharCode(65 + index)
}

/**
 * The finished file as bytes, header rows frozen.
 *
 * Everything — the download, and the tests — goes through here, so nothing can
 * accidentally serialize with plain `xlsx` and silently lose every style.
 */
export async function quantitiesToBytes(rows: QuantityRow[]): Promise<Uint8Array> {
  const { default: styled } = await import('xlsx-js-style')
  const wb = buildQuantitiesWorkbook(rows)
  // `bookSST` puts the text in a shared-string table, the way Salla's own
  // export is built — without it SheetJS emits `t="str"`, which is meant for
  // cached formula results rather than literal text.
  const raw = styled.write(wb, { bookType: 'xlsx', type: 'array', bookSST: true }) as ArrayBuffer
  return freezeHeader(new Uint8Array(raw))
}

/** Serialize to a downloadable .xlsx, header rows frozen. */
export async function quantitiesToBlob(rows: QuantityRow[]): Promise<Blob> {
  const bytes = await quantitiesToBytes(rows)
  // Copied into a plain ArrayBuffer: a Uint8Array over a possibly-shared
  // buffer is not a valid BlobPart under the DOM types.
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/**
 * Add the frozen-pane setting the writer cannot.
 *
 * An .xlsx is a zip of XML, so this unpacks it, splices one element into the
 * sheet's `<sheetView>`, and repacks. It is surgery on a document we generated
 * ourselves one line earlier, so the shape is known — and if the tag ever
 * looks unfamiliar the file is returned untouched rather than corrupted.
 */
export function freezeHeader(zipped: Uint8Array): Uint8Array {
  const PANE = `<pane ySplit="${FROZEN_ROWS}" topLeftCell="A${FROZEN_ROWS + 1}" activePane="bottomLeft" state="frozen"/>`
  try {
    const files = unzipSync(zipped)
    const path = Object.keys(files).find((p) => /^xl\/worksheets\/sheet1\.xml$/i.test(p))
    if (!path) return zipped

    const xml = strFromU8(files[path])
    const selfClosing = xml.match(/<sheetView\b([^>]*)\/>/)
    const patched = selfClosing
      ? xml.replace(selfClosing[0], `<sheetView${selfClosing[1]}>${PANE}</sheetView>`)
      : xml.replace(/(<sheetView\b[^>]*>)/, `$1${PANE}`)
    if (patched === xml) return zipped

    files[path] = strToU8(patched)
    return zipSync(files)
  } catch {
    // A file without the freeze still imports fine; a corrupted one does not.
    return zipped
  }
}

export async function downloadQuantities(rows: QuantityRow[], filename = 'salla-quantities.xlsx') {
  const url = URL.createObjectURL(await quantitiesToBlob(rows))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
