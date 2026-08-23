/**
 * The «Salla Product Quantities Sheet» layout, read off a real export.
 *
 * Every number here was taken from the XML inside a file Salla produced — the
 * column widths, the turquoise, the frozen pane, the `@` text formats. Keep
 * them exact: the point of this feature is that the file we hand back is
 * indistinguishable from the one the merchant downloaded.
 */

export const QUANTITIES_SHEET_NAME = 'Salla Product Quantities Sheet'

/** Row 1, column A — merged across A1:E1. */
export const SECTION_LABEL = 'بيانات المنتج'
/** Row 1, column F — the quantities band sits on its own. */
export const QUANTITIES_LABEL = 'الكميات'

/**
 * Row 2. `أسم المنتج` carries a hamza Salla itself spells that way — this is
 * their header text, not ours, so it is reproduced verbatim.
 */
export const QUANTITY_HEADERS = [
  'No.',
  'النوع',
  'أسم المنتج',
  'رمز المنتج sku',
  'غير محدود الكمية',
  'الكمية',
] as const

/** Widths as Excel stores them (character units), per column A..F. */
export const COLUMN_WIDTHS = [12.854, 11.711, 74.268, 25.137, 28.279, 14.568]

/**
 * Which columns Salla formats as text (`@`, numFmtId 49): النوع, أسم المنتج
 * and غير محدود الكمية. It matters for names like «40/42» or «S335 …», which
 * Excel would otherwise try to read as a date or a number.
 */
export const TEXT_COLUMNS = [false, true, true, false, true, false]

export const HEADER_FILL = 'FF5DD5C4'
export const HEADER_FONT_COLOR = 'FFFFFFFF'
export const HEADER_FONT_SIZE = 14
export const BODY_FONT_SIZE = 11
export const HEADER_ROW_HEIGHT = 30

/** Rows 1–2 stay put while the data scrolls. */
export const FROZEN_ROWS = 2
