import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { dateStr } from '../lib/dates'
import type { ScheduleEvent, MealPlan, Pantry } from '../types/database'

export function useScheduleData(familyId: string | null, from: string, to: string) {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [meals, setMeals] = useState<MealPlan[]>([])
  const [recentMeals, setRecentMeals] = useState<MealPlan[]>([])
  const [pantry, setPantry] = useState<Pantry[]>([])
  const [status, setStatus] = useState<{ ok: boolean; message: string }>({ ok: false, message: 'Laddar…' })

  const load = useCallback(async () => {
    if (!familyId) return

    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 10)

    try {
      const [evRes, mealRes, pantryRes, pastRes] = await Promise.all([
        supabase.from('schedule_events')
          .select('*').eq('family_id', familyId).gte('day', from).lte('day', to).order('time_start'),
        supabase.from('meal_plan')
          .select('*').eq('family_id', familyId).gte('day', from).lte('day', to).order('day').order('meal_type'),
        supabase.from('pantry')
          .select('*').eq('family_id', familyId).order('is_leftover', { ascending: false }).order('added_date', { ascending: false }),
        supabase.from('meal_plan')
          .select('*').eq('family_id', familyId).gte('day', dateStr(pastDate)).lt('day', from).order('day').order('meal_type').limit(30),
      ])

      setEvents(evRes.data ?? [])
      setMeals(mealRes.data ?? [])
      setPantry(pantryRes.data ?? [])
      setRecentMeals(pastRes.data ?? [])

      const leftovers = (pantryRes.data ?? []).filter(p => p.is_leftover).length
      const ingredients = (pantryRes.data ?? []).filter(p => !p.is_leftover).length
      setStatus({ ok: true, message: `Ansluten · ${leftovers} rester · ${ingredients} ingredienser` })
    } catch (e) {
      setStatus({ ok: false, message: 'Fel: ' + (e as Error).message })
    }
  }, [familyId, from, to])

  useEffect(() => { load() }, [load])

  return { events, meals, pantry, recentMeals, status, reload: load }
}
