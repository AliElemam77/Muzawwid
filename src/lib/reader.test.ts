import { describe, it, expect } from 'vitest'
import { readWorkbook } from './reader'

/** Build a File from a UTF-8 encoded string (like a real browser upload). */
function csvFile(name: string, text: string): File {
  const bytes = new TextEncoder().encode(text)
  return new File([bytes], name, { type: 'text/csv' })
}

describe('readWorkbook — encoding', () => {
  it('reads UTF-8 Arabic CSV without mojibake', async () => {
    const text = 'الاسم,السعر\nتم شكرت مع رسالة,100\nقميص قطن,250'
    const wb = await readWorkbook(csvFile('products.csv', text))

    expect(wb.sheets).toHaveLength(1)
    const sheet = wb.sheets[0]
    expect(sheet.headers).toEqual(['الاسم', 'السعر'])
    expect(sheet.rows[0]['الاسم']).toBe('تم شكرت مع رسالة')
    expect(sheet.rows[1]['الاسم']).toBe('قميص قطن')
  })

  it('strips a UTF-8 BOM from the first header', async () => {
    const wb = await readWorkbook(csvFile('bom.csv', '﻿الاسم,السعر\nكتاب,20'))
    expect(wb.sheets[0].headers).toEqual(['الاسم', 'السعر'])
  })
})
