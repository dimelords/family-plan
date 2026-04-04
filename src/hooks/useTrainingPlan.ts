import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { TrainingPlan, TrainingSession } from '../types/database'

export function useTrainingPlan(familyId: string | null, person: string | null) {
  const [plan, setPlan] = useState<TrainingPlan | null>(null)
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!familyId || !person) { setLoading(false); return }
    setLoading(true)

    // Load most recent active plan (end_date >= today)
    const today = new Date().toISOString().slice(0, 10)
    const { data: plans } = await supabase
      .from('training_plans')
      .select('*')
      .eq('family_id', familyId)
      .eq('person', person)
      .gte('end_date', today)
      .order('start_date', { ascending: false })
      .limit(1)

    const activePlan = plans?.[0] ?? null
    setPlan(activePlan)

    if (activePlan) {
      const { data: sess } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('plan_id', activePlan.id)
        .order('scheduled_date')
      setSessions(sess ?? [])
    } else {
      setSessions([])
    }
    setLoading(false)
  }, [familyId, person])

  useEffect(() => { load() }, [load])

  async function moveSession(sessionId: string, newDate: string) {
    await supabase
      .from('training_sessions')
      .update({ scheduled_date: newDate })
      .eq('id', sessionId)
    setSessions(prev =>
      prev.map(s => s.id === sessionId ? { ...s, scheduled_date: newDate } : s)
    )
  }

  async function toggleComplete(sessionId: string, completed: boolean) {
    await supabase
      .from('training_sessions')
      .update({ completed })
      .eq('id', sessionId)
    setSessions(prev =>
      prev.map(s => s.id === sessionId ? { ...s, completed } : s)
    )
  }

  return { plan, sessions, loading, reload: load, moveSession, toggleComplete }
}
