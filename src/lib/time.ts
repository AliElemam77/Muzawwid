/**
 * «من ٣ أيام» rather than «١٥/٠٨/٢٠٢٦، ٤:٣٠:٢٢ م».
 *
 * Shared by the saved-sheets drawer and the gallery: both are lists you scan,
 * and a relative age is read at a glance where a full timestamp is not.
 */
export function relativeTime(ts: string, locale: string): string {
  const then = new Date(ts).getTime()
  if (Number.isNaN(then)) return ts

  const seconds = Math.round((then - Date.now()) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]

  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit)
  }
  return format.format(0, 'minute')
}
