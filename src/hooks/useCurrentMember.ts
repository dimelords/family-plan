import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { FamilyMember, PersonPreferences } from '../types/database'

export function useCurrentMember(familyId: string | null, members: FamilyMember[]) {
  const [memberId, setMemberIdState] = useState<string | null>(
    () => localStorage.getItem('current_member_id'),
  )
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

  function setMemberId(id: string) {
    localStorage.setItem('current_member_id', id)
    setMemberIdState(id)
  }

  async function savePrefs(update: Partial<PersonPreferences>) {
    if (!memberId || !familyId) return
    const { data } = await supabase
      .from('person_preferences')
      .upsert({ family_id: familyId, family_member_id: memberId, ...update })
      .select()
      .single()
    setPrefs(data)
  }

  return { member, memberId, setMemberId, prefs, loadingPrefs, savePrefs }
}
