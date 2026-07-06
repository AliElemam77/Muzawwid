import * as XLSX from 'xlsx'

export type SourceRow = Record<string, string>

export interface SourceSheet {
  name: string
  headers: string[]
  rows: SourceRow[]
}

export interface SourceWorkbook {
  fileName: string
  sheets: SourceSheet[]
}

/** True for delimited-text files SheetJS would otherwise decode with the wrong codepage. */
function isTextFile(file: File): boolean {
  return /\.(csv|txt|tsv)$/i.test(file.name) || file.type === 'text/csv'
}

/** Read an .xlsx/.xls/.csv File into all sheets with normalized string cells. */
export async function readWorkbook(file: File): Promise<SourceWorkbook> {
  const buf = await file.arrayBuffer()

  // CSV/TSV are byte streams with no embedded encoding, so SheetJS may misread
  // UTF-8 Arabic as a single-byte codepage (mojibake like "ØªÙ Ø´ÙØ±Øª").
  // Decode such files as UTF-8 ourselves and hand SheetJS a real string.
  const wb = isTextFile(file)
    ? XLSX.read(new TextDecoder('utf-8').decode(buf), { type: 'string', raw: false })
    : XLSX.read(buf, { type: 'array', cellDates: false, raw: false, codepage: 65001 })

  const sheets: SourceSheet[] = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name]
    const aoa = XLSX.utils.sheet_to_json<string[]>(ws, {
      header: 1,
      defval: '',
      blankrows: false,
      raw: false,
    })
    if (aoa.length === 0) return { name, headers: [], rows: [] }

    // First non-empty row is the header.
    const rawHeaders = (aoa[0] ?? []).map((h) => String(h ?? '').trim())
    // De-duplicate empty/duplicate headers so mapping keys stay unique.
    const seen = new Map<string, number>()
    const headers = rawHeaders.map((h, i) => {
      const base = h || `عمود ${i + 1}`
      const count = seen.get(base) ?? 0
      seen.set(base, count + 1)
      return count === 0 ? base : `${base} (${count + 1})`
    })

    const rows: SourceRow[] = aoa.slice(1).map((r) => {
      const obj: SourceRow = {}
      headers.forEach((h, i) => {
        obj[h] = String(r[i] ?? '').trim()
      })
      return obj
    })

    return { name, headers, rows }
  })

  return { fileName: file.name, sheets: sheets.filter((s) => s.headers.length > 0) }
}
