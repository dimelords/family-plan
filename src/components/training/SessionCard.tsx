import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { TrainingSession } from '../../types/database'

interface Props {
  session: TrainingSession
  onToggleComplete: (id: string, completed: boolean) => void
}

export function SessionCard({ session, onToggleComplete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: session.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className={`session-card${session.completed ? ' completed' : ''}`}>
      <div className="session-drag-handle" {...listeners} {...attributes}>⠿</div>
      <div className="session-body">
        <div className="session-type">{session.workout_type}</div>
        <div className="session-exercises">
          {session.exercises.slice(0, 3).map((e, i) => (
            <span key={i} className="session-ex">{e.name}</span>
          ))}
          {session.exercises.length > 3 && (
            <span className="session-ex muted">+{session.exercises.length - 3}</span>
          )}
        </div>
        {session.notes && <div className="session-notes">{session.notes}</div>}
      </div>
      <button
        className={`session-check${session.completed ? ' done' : ''}`}
        onClick={() => onToggleComplete(session.id, !session.completed)}
      >
        {session.completed ? '✓' : '○'}
      </button>
    </div>
  )
}
