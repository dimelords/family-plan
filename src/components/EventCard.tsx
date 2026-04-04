import type { ScheduleEvent } from '../types/database'

interface Props {
  event: ScheduleEvent
  color: string
  onDelete: (id: string) => void
}

const TAG_CLASS: Record<string, string> = { SKOLA: 'tag-skola', GYM: 'tag-gym', VILA: 'tag-vila' }

export function EventCard({ event, color, onDelete }: Props) {
  return (
    <div className="event" style={{ borderLeftColor: color }}>
      <div className="ev-time">{event.time_start ? event.time_start.slice(0, 5) : '–'}</div>
      <div className="ev-content">
        <div className="ev-who">{event.person}</div>
        <div className="ev-what">{event.title}</div>
      </div>
      {event.tag && <div className={`ev-tag ${TAG_CLASS[event.tag] ?? ''}`}>{event.tag}</div>}
      <button className="ev-del" onClick={() => onDelete(event.id)}>✕</button>
    </div>
  )
}
