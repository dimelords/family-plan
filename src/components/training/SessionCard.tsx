import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { TrainingSession, Exercise } from '../../types/database'

interface Props {
  session: TrainingSession
  onToggleComplete: (id: string, completed: boolean) => void
  onExpand: (session: TrainingSession) => void
}

export function SessionCard({ session, onToggleComplete, onExpand }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: session.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`session-card${session.completed ? ' completed' : ''}`}
      onClick={() => onExpand(session)}
    >
      <div className="session-drag-handle" {...listeners} {...attributes}
        onClick={e => e.stopPropagation()}>⠿</div>
      <div className="session-body">
        <div className="session-type">{session.workout_type}</div>
        {((session.exercises ?? []) as unknown as Exercise[]).length > 0 && (
          <div className="session-ex-count">
            {((session.exercises ?? []) as unknown as Exercise[]).length} övningar
          </div>
        )}
      </div>
      <button
        className={`session-check${session.completed ? ' done' : ''}`}
        onClick={e => { e.stopPropagation(); onToggleComplete(session.id, !session.completed) }}
        title={session.completed ? 'Markera ej klar' : 'Markera klar'}
      >
        {session.completed ? '✓' : '○'}
      </button>
    </div>
  )
}
