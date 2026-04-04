import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { TrainingSession } from '../../types/database'

interface Props {
  session: TrainingSession
  onToggleComplete: (id: string, completed: boolean) => void
  onExpand: (session: TrainingSession) => void
}

// Strip parenthetical equipment info for compact display
function shortName(name: string): string {
  return name.split('(')[0].trim()
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
        <div className="session-exercises">
          {session.exercises.slice(0, 3).map((e, i) => (
            <div key={i} className="session-ex-row">
              <span className="session-ex-name">{shortName(e.name)}</span>
              <span className="session-ex-sets">{e.sets}×{e.reps}</span>
            </div>
          ))}
          {session.exercises.length > 3 && (
            <div className="session-ex-row muted">
              <span className="session-ex-name">+{session.exercises.length - 3} övningar till</span>
            </div>
          )}
        </div>
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
