export function getMonday(d: Date): Date {
  const dt = new Date(d)
  dt.setHours(0, 0, 0, 0)
  const day = dt.getDay()
  dt.setDate(dt.getDate() + (day === 0 ? -6 : 1 - day))
  return dt
}

export function dateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
}

export function weekNum(d: Date): number {
  const jan4 = new Date(d.getFullYear(), 0, 4)
  return Math.round((getMonday(d).getTime() - getMonday(jan4).getTime()) / 604_800_000) + 1
}

export function todayDayIndex(): number {
  return (new Date().getDay() + 6) % 7
}

// First Monday on or before the 1st of the month containing d
export function calendarGridStart(d: Date): Date {
  const first = new Date(d.getFullYear(), d.getMonth(), 1)
  return getMonday(first)
}

// Last Sunday on or after the last day of the month containing d
export function calendarGridEnd(d: Date): Date {
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  const day = last.getDay()
  const daysToSun = day === 0 ? 0 : 7 - day
  const end = new Date(last)
  end.setDate(end.getDate() + daysToSun)
  return end
}
