import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { ProgressPhoto } from '../types/database'

const BUCKET = 'progress-photos'

export function useProgressPhotos(familyId: string, memberName: string | undefined) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!memberName) return
    setLoading(true)
    const { data } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('family_id', familyId)
      .eq('member_name', memberName)
      .order('taken_at', { ascending: false })
      .limit(50)
    setPhotos(data ?? [])
    setLoading(false)
  }, [familyId, memberName])

  useEffect(() => { load() }, [load])

  /** Upload a File and insert a progress_photos row. Returns the new record or null. */
  const uploadPhoto = useCallback(async (
    file: File,
    takenAt: string,
    label: string | null,
    notes: string | null,
  ): Promise<ProgressPhoto | null> => {
    if (!memberName) return null

    const ext = file.name.split('.').pop() ?? 'jpg'
    const filename = `${familyId}/${memberName}/${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(filename, file, { upsert: false, contentType: file.type })

    if (uploadErr) { console.error('Upload error', uploadErr); return null }

    const { data, error: insertErr } = await supabase
      .from('progress_photos')
      .insert({ family_id: familyId, member_name: memberName, taken_at: takenAt, storage_path: filename, label, notes })
      .select()
      .single()

    if (insertErr) { console.error('Insert error', insertErr); return null }

    setPhotos(prev => [data, ...prev])
    return data
  }, [familyId, memberName])

  /** Get a short-lived signed URL for a storage path */
  const getUrl = useCallback(async (storagePath: string): Promise<string | null> => {
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 60 * 60)  // 1 hour
    return data?.signedUrl ?? null
  }, [])

  /** Save Claude's AI analysis back to a photo row */
  const saveAnalysis = useCallback(async (photoId: string, analysis: string) => {
    const { data } = await supabase
      .from('progress_photos')
      .update({ ai_analysis: analysis })
      .eq('id', photoId)
      .select()
      .single()
    if (data) setPhotos(prev => prev.map(p => p.id === photoId ? data : p))
  }, [])

  /** Delete a photo (storage + DB row) */
  const deletePhoto = useCallback(async (photo: ProgressPhoto) => {
    await supabase.storage.from(BUCKET).remove([photo.storage_path])
    await supabase.from('progress_photos').delete().eq('id', photo.id)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
  }, [])

  return { photos, loading, uploadPhoto, getUrl, saveAnalysis, deletePhoto, reload: load }
}
