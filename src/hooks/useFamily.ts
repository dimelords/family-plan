import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Family, FamilyMember } from '../types/database'

export function useFamily(familyId: string | null) {
  const [family, setFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!familyId) { setLoading(false); return }
    Promise.all([
      supabase.from('families').select('*').eq('id', familyId).single(),
      supabase.from('family_members').select('*').eq('family_id', familyId),
    ]).then(([{ data: fam }, { data: mems }]) => {
      setFamily(fam)
      setMembers(mems ?? [])
      setLoading(false)
    })
  }, [familyId])

  // Build colour map { name -> hex } for quick lookups
  const colorMap = Object.fromEntries(members.map(m => [m.name, m.color]))

  return { family, members, colorMap, loading }
}
