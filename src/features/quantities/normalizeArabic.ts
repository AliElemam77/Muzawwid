/**
 * Loose Arabic comparison for matching a merchant's row against Salla's.
 *
 * The same product is spelled inconsistently across a store and a spreadsheet
 * — «بلوزه» vs «بلوزة», «هاشمى» vs «هاشمي», stray double spaces from a copy
 * paste. Matching on the raw string loses those rows for no good reason.
 *
 * This is for COMPARISON ONLY. Every value written to the output file is the
 * original text from Salla's export, untouched — normalising the output would
 * corrupt the merchant's product names.
 */

/** Alef in all its forms, plus the two other letters that vary by habit. */
const FOLD: [RegExp, string][] = [
  [/[أإآٱ]/g, 'ا'],
  [/ى/g, 'ي'],
  [/ة/g, 'ه'],
]

export function normalizeArabic(value: string): string {
  let out = String(value ?? '')
  for (const [pattern, replacement] of FOLD) out = out.replace(pattern, replacement)
  // Any run of whitespace — including the newlines a wrapped cell carries —
  // collapses to one space, so «بلوزة  حمراء» and «بلوزة حمراء» agree.
  return out.replace(/\s+/g, ' ').trim()
}

/** True when two names refer to the same product under loose comparison. */
export function sameName(a: string, b: string): boolean {
  return normalizeArabic(a) === normalizeArabic(b)
}
