import { useState } from 'react'
import {
  DndContext, DragOverlay,
  PointerSensor, TouchSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core'
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import { DayColumn } from './DayColumn'
import { SessionCard } from './SessionCard'
import { DAY_NAMES } from '../../lib/constants'
import { dateStr } from '../../lib/dates'
import type { TrainingPlan, TrainingSession } from '../../types/database'

interface Props {
  plan: TrainingPlan
  sessions: TrainingSession[]
  onMove: (sessionId: string, newDate: string) => void
  onToggleComplete: (id: string, completed: boolean) => void
  onExpand: (session: TrainingSession) => void
}

function getWeeks(plan: TrainingPlan): Date[][] {
  const weeks: Date[][] = []
  const start = new Date(plan.start_date)
  for (let w = 0; w < 4; w++) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      const day = new Date(start)
      day.setDate(day.getDate() + w * 7 + d)
      week.push(day)
    }
    weeks.push(week)
  }
  return weeks
}

export function WeekView({ plan, sessions, onMove, onToggleComplete, onExpand }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [currentWeek, setCurrentWeek] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const weeks = getWeeks(plan)
  const today = dateStr(new Date())
  const activeSession = activeId ? sessions.find(s => s.id === activeId) : null

  const weekDays = weeks[currentWeek]

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const overId = String(over.id)
    const session = sessions.find(s => s.id === String(active.id))
    if (!session) return

    // over.id is either a date string (dropped on empty day) or another session id
    let targetDate: string
    if (overId.match(/^\d{4}-\d{2}-\d{2}$/)) {
      targetDate = overId
    } else {
      // Dropped on another session — use that session's date
      const targetSession = sessions.find(s => s.id === overId)
      targetDate = targetSession?.scheduled_date ?? session.scheduled_date
    }

    if (targetDate !== session.scheduled_date) {
      onMove(session.id, targetDate)
    }
  }

  function handleDragOver(event: DragOverEvent) {
    // Cross-week: if dragged near boundary, auto-switch week
    const { over } = event
    if (!over) return
    const overId = String(over.id)
    // If the over target is a date outside current week, switch week
    const overDate = overId.match(/^\d{4}-\d{2}-\d{2}$/) ? overId
      : sessions.find(s => s.id === overId)?.scheduled_date
    if (!overDate) return
    const weekIdx = weeks.findIndex(w => w.some(d => dateStr(d) === overDate))
    if (weekIdx >= 0 && weekIdx !== currentWeek) setCurrentWeek(weekIdx)
  }

  const completedCount = sessions.filter(s => s.completed).length

  return (
    <div className="week-view">
      {/* Week navigation */}
      <div className="week-view-nav">
        <button className="nav-btn" disabled={currentWeek === 0} onClick={() => setCurrentWeek(w => w - 1)}>‹</button>
        <div className="week-view-title">
          Vecka {currentWeek + 1}{currentWeek === 3 ? ' – Deload' : ''}
          <span className="week-view-dates">
            {dateStr(weekDays[0])} – {dateStr(weekDays[6])}
          </span>
        </div>
        <button className="nav-btn" disabled={currentWeek === 3} onClick={() => setCurrentWeek(w => w + 1)}>›</button>
      </div>

      <div className="plan-progress">
        <div className="plan-progress-bar" style={{ width: `${(completedCount / sessions.length) * 100}%` }} />
        <span className="plan-progress-label">{completedCount}/{sessions.length} pass klara</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={e => setActiveId(String(e.active.id))}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="day-columns">
          {weekDays.map((d) => {
            const ds = dateStr(d)
            return (
              <DayColumn
                key={ds}
                date={ds}
                label={`${DAY_NAMES[(d.getDay() + 6) % 7]} ${d.getDate()}`}
                sessions={sessions.filter(s => s.scheduled_date === ds)}
                isToday={ds === today}
                onToggleComplete={onToggleComplete}
                onExpand={onExpand}
              />
            )
          })}
        </div>

        <DragOverlay>
          {activeSession && (
            <SessionCard session={activeSession} onToggleComplete={() => {}} onExpand={() => {}} />
          )}
        </DragOverlay>
      </DndContext>

    </div>
  )
}
