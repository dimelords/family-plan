import { dateStr } from './dates'

/** Meeus/Jones/Butcher algorithm for Easter Sunday */
function getEaster(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

/** Returns map of dateStr → holiday name for a given year */
export function getSwedishHolidays(year: number): Record<string, string> {
  const h: Record<string, string> = {}
  const put = (d: Date, name: string) => { h[dateStr(d)] = name }
  const date = (m: number, day: number) => new Date(year, m - 1, day)

  // Fixed red days
  put(date(1,  1), 'Nyårsdagen')
  put(date(1,  6), 'Trettondedag jul')
  put(date(5,  1), 'Första maj')
  put(date(6,  6), 'Nationaldagen')
  put(date(12, 25), 'Juldagen')
  put(date(12, 26), 'Annandag jul')

  // Traditional eves (not official red days but widely observed)
  put(date(1,  5), 'Trettondagsafton')
  put(date(4, 30), 'Valborgsmässoafton')
  put(date(12, 24), 'Julafton')
  put(date(12, 31), 'Nyårsafton')

  // Easter-based
  const easter = getEaster(year)
  put(addDays(easter, -3), 'Skärtorsdagen')
  put(addDays(easter, -2), 'Långfredagen')
  put(addDays(easter, -1), 'Påskafton')
  put(easter,              'Påskdagen')
  put(addDays(easter,  1), 'Annandag påsk')
  put(addDays(easter, 39), 'Kristi himmelsfärdsdag')
  put(addDays(easter, 48), 'Pingstafton')
  put(addDays(easter, 49), 'Pingstdagen')

  // Midsummer: Midsommarafton = Friday, Midsommardagen = Saturday (June 19–26)
  let mid = date(6, 19)
  while (mid.getDay() !== 5) mid = addDays(mid, 1) // find Friday
  put(mid,            'Midsommarafton')
  put(addDays(mid, 1), 'Midsommardagen')

  // Alla helgons dag: Saturday between Oct 31 – Nov 6
  let allSaints = date(10, 31)
  while (allSaints.getDay() !== 6) allSaints = addDays(allSaints, 1)
  put(allSaints, 'Alla helgons dag')

  return h
}

/** Cache holidays for current + next year */
const _cache: Record<number, Record<string, string>> = {}
function holidaysFor(year: number): Record<string, string> {
  if (!_cache[year]) _cache[year] = getSwedishHolidays(year)
  return _cache[year]
}

/** Returns holiday name if date is a Swedish holiday, else null */
export function getHolidayName(ds: string): string | null {
  const year = parseInt(ds.slice(0, 4))
  return holidaysFor(year)[ds] ?? null
}
