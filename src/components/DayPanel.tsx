import { GYM_DAYS, GYM_LABELS } from '../lib/constants'
import { dateStr } from '../lib/dates'
import { EventCard } from './EventCard'
import type { ScheduleEvent } from '../types/database'

interface Props {
  days: Date[]
  selectedDay: number
  events: ScheduleEvent[]
  colorMap: Record<string, string>
  onAddEvent: (dayIdx: number) => void
  onDeleteEvent: (id: string) => void
  onSwipe: (dir: 1 | -1) => void
}

export function DayPanel({ days, selectedDay, events, colorMap, onAddEvent, onDeleteEvent, onSwipe }: Props) {
  const d = days[selectedDay]
  const ds = dateStr(d)
  const isGym = (GYM_DAYS as readonly number[]).includes(selectedDay)
  const label = d.toLocaleString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })
  const dayEvents = events
    .filter(e => e.day === ds)
    .sort((a, b) => (a.time_start ?? '').localeCompare(b.time_start ?? ''))

  let startX: number | null = null

  return (
    <div
      className="day-panel-wrapper"
      onTouchStart={e => { startX = e.touches[0].clientX }}
      onTouchEnd={e => {
        if (startX === null) return
        const diff = startX - e.changedTouches[0].clientX
        if (Math.abs(diff) > 45) onSwipe(diff > 0 ? 1 : -1)
        startX = null
      }}
    >
      <div className="sec-label">
        📅 {label.charAt(0).toUpperCase() + label.slice(1)}
        <button className="add-btn" onClick={() => onAddEvent(selectedDay)}>+ Lägg till</button>
      </div>

      {isGym && (
        <div className="event ev-gym" style={{ marginBottom: 6 }}>
          <div className="ev-time">07:00</div>
          <div className="ev-content">
            <div className="ev-who">Fredrik</div>
            <div className="ev-what">🏋️ Gym – {GYM_LABELS[selectedDay]}</div>
          </div>
          <div className="ev-tag tag-gym">GYM</div>
        </div>
      )}

      <div className="events">
        {dayEvents.length === 0
          ? <div className="empty-state">Inga aktiviteter – tryck + för att lägga till</div>
          : dayEvents.map(ev => (
              <EventCard
                key={ev.id}
                event={ev}
                color={colorMap[ev.person] ?? 'var(--muted)'}
                onDelete={onDeleteEvent}
              />
            ))
        }
      </div>
    </div>
  )
}
