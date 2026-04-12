import { useMemo } from 'react'
import { calendarGridStart, calendarGridEnd, weekDays, dateStr } from '../lib/dates'
import { getHolidayName } from '../lib/holidays'
import type { ScheduleEvent } from '../types/database'

const DAY_HEADERS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

interface Props {
  weekStart: Date
  selectedDay: number
  events: ScheduleEvent[]
  colorMap: Record<string, string>
  onSelectDate: (date: Date) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onAddEvent: () => void
}

export function MonthCalendar({ weekStart, selectedDay, events, colorMap, onSelectDate, onPrevMonth, onNextMonth, onAddEvent }: Props) {
  const today = dateStr(new Date())
  const selectedDate = dateStr(weekDays(weekStart)[selectedDay])

  const cells = useMemo(() => {
    const start = calendarGridStart(weekStart)
    const end = calendarGridEnd(weekStart)
    const result: Date[] = []
    const cur = new Date(start)
    while (cur <= end) {
      result.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    return result
  }, [weekStart])

  const monthLabel = weekStart.toLocaleString('sv-SE', { month: 'long', year: 'numeric' })
  const currentMonth = weekStart.getMonth()

  return (
    <div className="month-calendar">
      <div className="month-header">
        <button className="nav-btn" onClick={onPrevMonth}>‹</button>
        <span className="month-title">{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="add-btn-icon" onClick={onAddEvent} title="Lägg till händelse">⊕</button>
          <button className="nav-btn" onClick={onNextMonth}>›</button>
        </div>
      </div>

      <div className="month-day-headers">
        {DAY_HEADERS.map(h => (
          <div key={h} className="month-day-header-cell">{h}</div>
        ))}
      </div>

      <div className="month-grid">
        {cells.map((cell, i) => {
          const ds = dateStr(cell)
          const isOutside = cell.getMonth() !== currentMonth
          const isToday = ds === today
          const isSelected = ds === selectedDate
          const holiday = getHolidayName(ds)
          const dow = cell.getDay() // 0=Sun, 6=Sat
          const isWeekend = dow === 0 || dow === 6
          const persons = [...new Set(events.filter(e => e.day === ds).map(e => e.person))]

          const cls = [
            'month-cell',
            isOutside ? 'outside' : '',
            isToday ? 'today' : '',
            isSelected ? 'selected' : '',
            holiday ? 'holiday' : '',
            isWeekend ? 'weekend' : '',
          ].filter(Boolean).join(' ')

          return (
            <div key={i} className={cls} onClick={() => !isOutside && onSelectDate(cell)}>
              <div className="month-cell-num">{cell.getDate()}</div>
              <div className="month-cell-dots">
                {persons.slice(0, 4).map(p => (
                  <div key={p} className="month-dot" style={{ background: colorMap[p] ?? 'var(--muted)' }} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
