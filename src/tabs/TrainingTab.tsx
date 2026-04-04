import { useState } from 'react'
import { useTrainingPlan } from '../hooks/useTrainingPlan'
import { WeekView } from '../components/training/WeekView'
import { GeneratePlanModal } from '../components/modals/GeneratePlanModal'
import type { FamilyMember, PersonPreferences } from '../types/database'

interface Props {
  familyId: string
  member: FamilyMember
  prefs: PersonPreferences
}

export function TrainingTab({ familyId, member, prefs }: Props) {
  const { plan, sessions, loading, reload, moveSession, toggleComplete } = useTrainingPlan(familyId, member.name)
  const [generateOpen, setGenerateOpen] = useState(false)

  if (loading) return <div className="empty-state" style={{ padding: '24px 0' }}>Laddar träningsplan…</div>

  return (
    <div>
      {plan ? (
        <>
          <div className="plan-header">
            <div>
              <div className="plan-header-title">Aktiv plan</div>
              <div className="plan-header-dates">{plan.start_date} – {plan.end_date}</div>
              {plan.goal_snapshot && <div className="plan-header-goal">{plan.goal_snapshot}</div>}
            </div>
            <button className="add-btn" onClick={() => setGenerateOpen(true)}>+ Ny plan</button>
          </div>
          <WeekView
            plan={plan}
            sessions={sessions}
            onMove={moveSession}
            onToggleComplete={toggleComplete}
          />
        </>
      ) : (
        <div className="no-plan-state">
          <div className="no-plan-icon">🏋️</div>
          <div className="no-plan-text">Ingen aktiv träningsplan</div>
          <div className="no-plan-sub">
            Låt AI skapa en personlig 4-veckorsplan baserad på dina mål och preferenser.
          </div>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setGenerateOpen(true)}>
            ✨ Generera träningsplan
          </button>
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
    </div>
  )
}
