import { dateStr } from '../lib/dates'
import { EventCard } from './EventCard'
import type { ScheduleEvent } from '../types/database'

interface Props {
  days: Date[]
  selectedDay: number
  events: ScheduleEvent[]
  colorMap: Record<string, string>
  onDeleteEvent: (id: string) => void
  onSwipe: (dir: 1 | -1) => void
}

export function DayPanel({ days, selectedDay, events, colorMap, onDeleteEvent, onSwipe }: Props) {
  const d = days[selectedDay]
  const ds = dateStr(d)
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
      {dayEvents.length > 0 && (
        <div className="events">
          {dayEvents.map(ev => (
            <EventCard
              key={ev.id}
              event={ev}
              color={colorMap[ev.person] ?? 'var(--muted)'}
              onDelete={onDeleteEvent}
            />
          ))}
        </div>
      )}
    </div>
  )
}
