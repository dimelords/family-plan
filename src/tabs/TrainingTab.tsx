import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTrainingPlan } from '../hooks/useTrainingPlan'
import { GeneratePlanModal } from '../components/modals/GeneratePlanModal'
import { SessionDetailModal } from '../components/training/SessionDetailModal'
import { FULL_DAY_NAMES } from '../lib/constants'
import { getHolidayName } from '../lib/holidays'
import { dateStr } from '../lib/dates'
import type { FamilyMember, PersonPreferences, TrainingSession, Exercise } from '../types/database'

interface Props {
  familyId: string
  member: FamilyMember
  prefs: PersonPreferences
}

function shortName(name: string): string {
  return name.split('(')[0].trim()
}

function generateDays(start: string, end: string): string[] {
  const days: string[] = []
  const d = new Date(start + 'T12:00:00')
  const endDate = new Date(end + 'T12:00:00')
  while (d <= endDate) {
    days.push(dateStr(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

function dayLabel(ds: string): string {
  const d = new Date(ds + 'T12:00:00')
  const name = FULL_DAY_NAMES[(d.getDay() + 6) % 7]
  return `${name} ${d.getDate()}/${d.getMonth() + 1}`
}

export function TrainingTab({ familyId, member, prefs }: Props) {
  const { plan, sessions, loading, reload, toggleComplete } = useTrainingPlan(familyId, member.name)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [expandedSession, setExpandedSession] = useState<TrainingSession | null>(null)
  const todayRef = useRef<HTMLDivElement>(null)
  const today = dateStr(new Date())

  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'instant', block: 'start' })
    }
  }, [plan])

  if (loading) return <div className="empty-state" style={{ padding: '24px 0' }}>Laddar träningsplan…</div>

  const planDays = plan ? generateDays(plan.start_date, plan.end_date) : []

  return (
    <div className="card">
      <div className="sec-label">
        Träningsplan
        <button className="add-btn" onClick={() => setGenerateOpen(true)}>
          {plan ? '+ Ny plan' : '+ Generera'}
        </button>
      </div>

      {!plan ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 13 }}>
          Ingen aktiv träningsplan. Skapa en med AI ovan.
        </div>
      ) : (
        <div className="plan-day-list">
          {planDays.map(ds => {
            const daySessions = sessions.filter(s => s.scheduled_date === ds)
            const isToday = ds === today
            const isPast = ds < today
            const holiday = getHolidayName(ds)

            return (
              <div
                key={ds}
                ref={isToday ? todayRef : undefined}
                className={`meal-day-block${isPast ? ' plan-day-past' : ''}`}
              >
                <div className={`meal-day-header${isToday ? ' plan-day-today' : ''}`}>
                  {dayLabel(ds)}
                  {isToday && <span className="today-badge">Idag</span>}
                  {holiday && <span className="holiday-badge">{holiday}</span>}
                </div>

                {daySessions.length === 0 ? (
                  <div className="plan-day-rest">Vila</div>
                ) : (
                  <div className="meal-items">
                    {daySessions.map(s => (
                      <div
                        key={s.id}
                        className={`meal-item plan-session-row${s.completed ? ' completed' : ''}`}
                        onClick={() => setExpandedSession(s)}
                      >
                        <div className="meal-item-inner">
                          <span className="ml">{s.workout_type}</span>
                          {((s.exercises as unknown) as Exercise[]).slice(0, 3).map((e: Exercise) => shortName(e.name)).join(' · ')}
                          {s.exercises.length > 3 && ` +${s.exercises.length - 3}`}
                        </div>
                        <span className={`plan-check${s.completed ? ' done' : ''}`}>
                          {s.completed ? '✓' : '○'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <GeneratePlanModal
        open={generateOpen}
        familyId={familyId}
        person={member.name}
        prefs={prefs}
        previousPlan={plan}
        onClose={() => setGenerateOpen(false)}
        onSaved={() => { setGenerateOpen(false); reload() }}
      />

      {expandedSession && createPortal(
        <SessionDetailModal
          session={expandedSession}
          onClose={() => setExpandedSession(null)}
          onToggleComplete={(id, completed) => { toggleComplete(id, completed); setExpandedSession(null) }}
        />,
        document.body,
      )}
    </div>
  )
}
