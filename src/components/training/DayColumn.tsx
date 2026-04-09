import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SessionCard } from './SessionCard'
import type { TrainingSession } from '../../types/database'

interface Props {
  date: string
  label: string
  sessions: TrainingSession[]
  isToday: boolean
  onToggleComplete: (id: string, completed: boolean) => void
  onExpand: (session: TrainingSession) => void
}

export function DayColumn({ date, label, sessions, isToday, onToggleComplete, onExpand }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: date })

  return (
    <div className={`day-column${isToday ? ' today' : ''}${isOver ? ' drop-over' : ''}`} ref={setNodeRef}>
      <div className="day-col-label">{label}</div>
      <div className="day-col-sessions">
        <SortableContext items={sessions.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {sessions.length === 0
            ? <div className="day-col-empty">Vila</div>
            : sessions.map(s => (
                <SessionCard key={s.id} session={s} onToggleComplete={onToggleComplete} onExpand={onExpand} />
              ))
          }
        </SortableContext>
      </div>
    </div>
  )
}
