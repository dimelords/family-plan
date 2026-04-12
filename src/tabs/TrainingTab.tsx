import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTrainingPlan } from '../hooks/useTrainingPlan'
import { GeneratePlanModal } from '../components/modals/GeneratePlanModal'
import { SessionDetailModal } from '../components/training/SessionDetailModal'
import { WeekView } from '../components/training/WeekView'
import type { FamilyMember, PersonPreferences, TrainingSession } from '../types/database'

interface Props {
  familyId: string
  member: FamilyMember
  prefs: PersonPreferences
}

export function TrainingTab({ familyId, member, prefs }: Props) {
  const { plan, sessions, loading, reload, moveSession, deleteSession, toggleComplete } = useTrainingPlan(familyId, member.name)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [expandedSession, setExpandedSession] = useState<TrainingSession | null>(null)

  if (loading) return <div className="empty-state" style={{ padding: '24px 0' }}>Laddar träningsplan…</div>

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button className="add-btn" onClick={() => setGenerateOpen(true)}>
          {plan ? '+ Ny plan' : '+ Generera'}
        </button>
      </div>

      {!plan ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 13 }}>
          Ingen aktiv träningsplan. Skapa en med AI ovan.
        </div>
      ) : (
        <WeekView
          plan={plan}
          sessions={sessions}
          familyId={familyId}
          onMove={moveSession}
          onDelete={deleteSession}
          onToggleComplete={toggleComplete}
          onExpand={setExpandedSession}
        />
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
