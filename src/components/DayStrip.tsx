import { DAY_NAMES } from '../lib/constants'
import { dateStr } from '../lib/dates'
import type { ScheduleEvent } from '../types/database'

interface Props {
  days: Date[]
  selectedDay: number
  events: ScheduleEvent[]
  colorMap: Record<string, string>
  onSelect: (idx: number) => void
}

export function DayStrip({ days, selectedDay, events, colorMap, onSelect }: Props) {
  return (
    <>
      <p className="swipe-hint">Svep eller tryck för att byta dag</p>
      <div className="day-strip">
        {days.map((d, i) => {
          const ds = dateStr(d)
          const persons = [...new Set(events.filter(e => e.day === ds).map(e => e.person))]
          return (
            <div
              key={i}
              className={`day-btn${i >= 5 ? ' weekend' : ''}${i === selectedDay ? ' active' : ''}`}
              onClick={() => onSelect(i)}
            >
              <div className="dname">{DAY_NAMES[i]}</div>
              <div className="dnum">{d.getDate()}</div>
              <div className="ddots">
                {persons.slice(0, 4).map(p => (
                  <div key={p} className="dot" style={{ background: colorMap[p] ?? 'var(--muted)' }} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
