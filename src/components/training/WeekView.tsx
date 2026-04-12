import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import {
  DndContext, DragOverlay,
  PointerSensor, TouchSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { DayColumn } from './DayColumn'
import { SessionCard } from './SessionCard'
import { dateStr } from '../../lib/dates'
import type { TrainingPlan, TrainingSession } from '../../types/database'

interface Props {
  plan: TrainingPlan
  sessions: TrainingSession[]
  onMove: (sessionId: string, newDate: string) => void
  onDelete: (sessionId: string) => void
  onToggleComplete: (id: string, completed: boolean) => void
  onExpand: (session: TrainingSession) => void
  familyId: string   // needed to check meal_plan
}

interface Conflict {
  dragged: TrainingSession
  existing: TrainingSession
  targetDate: string
  nextDate: string
  nextDayFree: boolean
}

interface MealPrompt {
  oldDate: string   // was a training day → now rest
  newDate: string   // was a rest day → now training
  hasMealsOld: boolean
  hasMealsNew: boolean
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function humanDate(ds: string): string {
  const d = new Date(ds + 'T12:00:00')
  const days = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör']
  return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
}

function getVisibleDays(): string[] {
  return Array.from({ length: 4 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    d.setHours(0, 0, 0, 0)
    return dateStr(d)
  })
}

export function WeekView({ sessions, onMove, onDelete, onToggleComplete, onExpand, familyId }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [conflict, setConflict] = useState<Conflict | null>(null)
  const [mealPrompt, setMealPrompt] = useState<MealPrompt | null>(null)

  const checkMeals = useCallback(async (oldDate: string, newDate: string) => {
    const { data } = await supabase
      .from('meal_plan')
      .select('day')
      .eq('family_id', familyId)
      .in('day', [oldDate, newDate])
    const days = new Set((data ?? []).map(r => r.day))
    if (days.has(oldDate) || days.has(newDate)) {
      setMealPrompt({
        oldDate, newDate,
        hasMealsOld: days.has(oldDate),
        hasMealsNew: days.has(newDate),
      })
    }
  }, [familyId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const visibleDays = getVisibleDays()
  const today = visibleDays[0]
  const activeSession = activeId ? sessions.find(s => s.id === activeId) : null

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const overId = String(over.id)
    const dragged = sessions.find(s => s.id === String(active.id))
    if (!dragged) return

    let targetDate: string
    if (overId.match(/^\d{4}-\d{2}-\d{2}$/)) {
      targetDate = overId
    } else {
      const targetSession = sessions.find(s => s.id === overId)
      targetDate = targetSession?.scheduled_date ?? dragged.scheduled_date
    }

    if (targetDate === dragged.scheduled_date) return

    const existing = sessions.find(
      s => s.scheduled_date === targetDate && s.id !== dragged.id
    )

    if (existing) {
      const nextDate = addDays(targetDate, 1)
      const nextDayFree = !sessions.some(s => s.scheduled_date === nextDate && s.id !== dragged.id)
      setConflict({ dragged, existing, targetDate, nextDate, nextDayFree })
    } else {
      onMove(dragged.id, targetDate)
      checkMeals(dragged.scheduled_date, targetDate)
    }
  }

  function resolveConflict(choice: 'replace' | 'push') {
    if (!conflict) return
    const oldDate = conflict.dragged.scheduled_date
    if (choice === 'replace') {
      onDelete(conflict.existing.id)
      onMove(conflict.dragged.id, conflict.targetDate)
    } else {
      onMove(conflict.existing.id, conflict.nextDate)
      onMove(conflict.dragged.id, conflict.targetDate)
    }
    setConflict(null)
    checkMeals(oldDate, conflict.targetDate)
  }

  return (
    <div className="week-view">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={e => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
      >
        <div className="day-columns">
          {visibleDays.map((ds) => {
            const d = new Date(ds + 'T12:00:00')
            return (
              <DayColumn
                key={ds}
                date={ds}
                label={d.toLocaleString('sv-SE', { weekday: 'long', day: 'numeric', month: 'numeric' })}
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

      {/* Meal update prompt */}
      {mealPrompt && (
        <div className="conflict-overlay">
          <div className="conflict-dialog">
            <p className="conflict-title">Uppdatera kostplanen?</p>
            <p className="conflict-sub">
              Träningspasset är flyttat.
              {mealPrompt.hasMealsOld && ` ${humanDate(mealPrompt.oldDate)} är nu en vilodag men har planerade måltider.`}
              {mealPrompt.hasMealsNew && ` ${humanDate(mealPrompt.newDate)} är nu en träningsdag men har planerade måltider.`}
              {' '}Vill du uppdatera kostplanen för att matcha?
            </p>
            <div className="conflict-actions">
              <button className="btn-primary" onClick={async () => {
                const days = [
                  mealPrompt.hasMealsOld ? mealPrompt.oldDate : null,
                  mealPrompt.hasMealsNew ? mealPrompt.newDate : null,
                ].filter(Boolean) as string[]
                for (const d of days) {
                  await supabase.from('meal_plan').delete()
                    .eq('family_id', familyId).eq('day', d)
                }
                setMealPrompt(null)
              }}>
                Ja, rensa berörda dagar
              </button>
              <button className="btn-secondary" onClick={() => setMealPrompt(null)}>
                Behåll som det är
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conflict resolution dialog */}
      {conflict && (
        <div className="conflict-overlay">
          <div className="conflict-dialog">
            <p className="conflict-title">
              {humanDate(conflict.targetDate)} har redan ett pass
            </p>
            <p className="conflict-sub">
              <strong>{conflict.existing.workout_type}</strong> är bokad den dagen. Vad vill du göra?
            </p>
            <div className="conflict-actions">
              {conflict.nextDayFree && (
                <button className="btn-primary" onClick={() => resolveConflict('push')}>
                  Flytta befintligt till {humanDate(conflict.nextDate)}
                </button>
              )}
              <button className="btn-danger" onClick={() => resolveConflict('replace')}>
                Ta bort befintligt pass
              </button>
              <button className="btn-secondary" onClick={() => setConflict(null)}>
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
