import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { BodyLog } from '../types/database'

export function useBodyLog(familyId: string, memberName: string | undefined) {
  const [entries, setEntries] = useState<BodyLog[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!memberName) return
    setLoading(true)
    const { data } = await supabase
      .from('body_log')
      .select('*')
      .eq('family_id', familyId)
      .eq('member_name', memberName)
      .order('logged_at', { ascending: false })
      .limit(90)  // ~3 months
    setEntries(data ?? [])
    setLoading(false)
  }, [familyId, memberName])

  useEffect(() => { load() }, [load])

  const saveEntry = useCallback(async (entry: {
    logged_at: string
    weight_kg?: number | null
    waist_cm?: number | null
    hip_cm?: number | null
    neck_cm?: number | null
    chest_cm?: number | null
    arm_cm?: number | null
    thigh_cm?: number | null
    estimated_bf_pct?: number | null
    notes?: string | null
  }) => {
    if (!memberName) return

    const { data, error } = await supabase
      .from('body_log')
      .upsert(
        { family_id: familyId, member_name: memberName, ...entry },
        { onConflict: 'family_id,member_name,logged_at' }
      )
      .select()
      .single()

    if (!error && data) {
      setEntries(prev => {
        const filtered = prev.filter(e => e.logged_at !== data.logged_at)
        return [data, ...filtered].sort((a, b) => b.logged_at.localeCompare(a.logged_at))
      })
    }
    return error
  }, [familyId, memberName])

  return { entries, loading, saveEntry, reload: load }
}
