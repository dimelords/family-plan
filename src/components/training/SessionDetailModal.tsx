import { useEffect, useRef } from 'react'
import type { TrainingSession } from '../../types/database'

interface Props {
  session: TrainingSession
  onClose: () => void
  onToggleComplete: (id: string, completed: boolean) => void
}

export function SessionDetailModal({ session, onClose, onToggleComplete }: Props) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  // Acquire wake lock when expanded so screen stays on during workout
  useEffect(() => {
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen')
        .then(lock => { wakeLockRef.current = lock })
        .catch(() => { /* denied or unsupported — silent fail */ })
    }
    return () => {
      wakeLockRef.current?.release()
      wakeLockRef.current = null
    }
  }, [])

  // Re-acquire if user comes back to tab (wake lock released on visibility change)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible' && 'wakeLock' in navigator) {
        navigator.wakeLock.request('screen')
          .then(lock => { wakeLockRef.current = lock })
          .catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const weekNumber = (() => {
    const d = new Date(session.scheduled_date)
    // crude: just use day of month to guess "Vecka N" from notes
    return null
  })()

  return (
    <div className="session-detail-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="session-detail-sheet">
        {/* Header */}
        <div className="session-detail-header">
          <div>
            <div className="session-detail-type">{session.workout_type}</div>
            <div className="session-detail-date">{session.scheduled_date}</div>
          </div>
          <button className="session-detail-close" onClick={onClose}>✕</button>
        </div>

        {/* Session notes (AI coaching notes) */}
        {session.notes && (
          <div className="session-detail-coaching">
            <div className="session-detail-coaching-label">🤖 Tränarens tips</div>
            <div className="session-detail-coaching-text">{session.notes}</div>
          </div>
        )}

        {/* Exercise list */}
        <div className="session-detail-exercises">
          {session.exercises.map((e, i) => (
            <div key={i} className="session-detail-ex">
              <div className="session-detail-ex-header">
                <span className="session-detail-ex-num">{i + 1}</span>
                <span className="session-detail-ex-name">{e.name}</span>
                <span className="session-detail-ex-sets">{e.sets} × {e.reps}</span>
              </div>
              {e.notes && (
                <div className="session-detail-ex-notes">{e.notes}</div>
              )}
            </div>
          ))}
        </div>

        {/* Complete button */}
        <button
          className={`session-detail-complete-btn${session.completed ? ' done' : ''}`}
          onClick={() => onToggleComplete(session.id, !session.completed)}
        >
          {session.completed ? '✓ Klart! Tryck för att ångra' : '○ Markera passet som klart'}
        </button>

        <div className="session-detail-wake-hint">📱 Skärmen hålls aktiv under passet</div>
      </div>
    </div>
  )
}
