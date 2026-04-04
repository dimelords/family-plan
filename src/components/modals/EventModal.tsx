import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { dateStr } from '../../lib/dates'
import { TAG_LABELS } from '../../lib/constants'
import type { FamilyMember } from '../../types/database'

interface Props {
  open: boolean
  familyId: string
  day: Date | null
  members: FamilyMember[]
  onClose: () => void
  onSaved: () => void
}

export function EventModal({ open, familyId, day, members, onClose, onSaved }: Props) {
  const [title, setTitle] = useState('')
  const [person, setPerson] = useState(members[0]?.name ?? '')
  const [time, setTime] = useState('')
  const [tag, setTag] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open || !day) return null

  async function save() {
    if (!title.trim()) return
    setSaving(true)
    await supabase.from('schedule_events').insert({
      family_id: familyId,
      day: dateStr(day!),
      person,
      title: title.trim(),
      time_start: time || null,
      tag: tag || null,
    })
    setSaving(false)
    setTitle(''); setTime(''); setTag('')
    onSaved()
  }

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Lägg till aktivitet</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label className="form-label">Person</label>
          <select className="form-select" value={person} onChange={e => setPerson(e.target.value)}>
            {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Aktivitet</label>
          <input className="form-input" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="T.ex. Fotbollsträning" onKeyDown={e => e.key === 'Enter' && save()} />
        </div>
        <div className="form-group">
          <label className="form-label">Tid (valfritt)</label>
          <input className="form-input" type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Tagg</label>
          <select className="form-select" value={tag} onChange={e => setTag(e.target.value)}>
            <option value="">Ingen</option>
            {TAG_LABELS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button className="btn-primary" disabled={saving} onClick={save}>
          {saving ? 'Sparar…' : 'Spara'}
        </button>
      </div>
    </div>
  )
}
