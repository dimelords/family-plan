import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { FamilyMember, PersonPreferences } from '../types/database'

export function useCurrentMember(familyId: string | null, members: FamilyMember[], memberId: string | null) {
  const [prefs, setPrefs] = useState<PersonPreferences | null>(null)
  const [loadingPrefs, setLoadingPrefs] = useState(true)

  const member = members.find(m => m.id === memberId) ?? null

  useEffect(() => {
    if (!memberId) { setPrefs(null); setLoadingPrefs(false); return }
    setLoadingPrefs(true)
    supabase
      .from('person_preferences')
      .select('*')
      .eq('family_member_id', memberId)
      .maybeSingle()
      .then(({ data }) => {
        setPrefs(data)
        setLoadingPrefs(false)
      })
  }, [memberId])

  async function savePrefs(update: Partial<PersonPreferences>) {
    if (!memberId || !familyId) return
    const { data, error } = await supabase
      .from('person_preferences')
      .upsert(
        { family_id: familyId, family_member_id: memberId, ...update },
        { onConflict: 'family_member_id' },
      )
      .select()
      .single()
    if (error) {
      console.error('[savePrefs] Supabase error:', error)
      alert('Kunde inte spara inställningar: ' + error.message)
      return
    }
    setPrefs(data)
  }

  return { member, prefs, loadingPrefs, savePrefs }
}
