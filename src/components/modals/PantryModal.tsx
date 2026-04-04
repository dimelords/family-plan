import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { claudeCall, parseJson, getApiKey } from '../../lib/claude'
import { dateStr } from '../../lib/dates'

interface Props {
  open: boolean
  familyId: string
  mode: 'manual' | 'ai'
  onClose: () => void
  onSaved: () => void
}

type PantryInsert = { item: string; is_leftover: boolean; expires_date: string | null }

export function PantryModal({ open, familyId, mode, onClose, onSaved }: Props) {
  const [item, setItem] = useState('')
  const [isLeftover, setIsLeftover] = useState(false)
  const [expires, setExpires] = useState('')
  const [aiInput, setAiInput] = useState('')
  const [parsed, setParsed] = useState<PantryInsert[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  async function saveManual() {
    if (!item.trim()) return
    setSaving(true)
    await supabase.from('pantry').insert({
      family_id: familyId, item: item.trim(),
      is_leftover: isLeftover, expires_date: expires || null,
    })
    setSaving(false)
    setItem(''); setExpires(''); setIsLeftover(false)
    onSaved()
  }

  async function parseAI() {
    if (!aiInput.trim()) return
    if (!getApiKey()) { setAiError('Ingen API-nyckel. Lägg till under ⚙️'); return }
    setAiLoading(true); setAiError(''); setParsed([])
    const today = dateStr(new Date())
    const system = 'Du tolkar fritext om inköp och matrester och svarar BARA med JSON.'
    const prompt = `Idag är det ${today}. Användaren skriver:\n"${aiInput}"\n\nExtrahera alla nämnda ingredienser och rester som JSON-array:\n[{"item":"...","is_leftover":false,"expires_date":null}]\n- is_leftover=true om det är rester\n- expires_date: ISO-datum om nämnt, annars null\nSvara BARA med JSON-array.`
    try {
      const text = await claudeCall(system, prompt, 400)
      setParsed(parseJson<PantryInsert[]>(text))
    } catch (e) { setAiError((e as Error).message) }
    setAiLoading(false)
  }

  async function saveAll() {
    setSaving(true)
    for (const p of parsed) {
      await supabase.from('pantry').insert({ family_id: familyId, ...p })
    }
    setSaving(false)
    setParsed([]); setAiInput('')
    onSaved()
  }

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{mode === 'manual' ? 'Lägg till i skafferi' : '✨ AI-tolkning'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {mode === 'manual' && (
          <>
            <div className="form-group">
              <label className="form-label">Vara</label>
              <input className="form-input" value={item} onChange={e => setItem(e.target.value)} placeholder="T.ex. Kycklingfilé 500g" />
            </div>
            <div className="form-group">
              <label className="form-label">Typ</label>
              <select className="form-select" value={String(isLeftover)} onChange={e => setIsLeftover(e.target.value === 'true')}>
                <option value="false">Ingrediens</option>
                <option value="true">Rest från måltid</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Bäst före (valfritt)</label>
              <input className="form-input" type="date" value={expires} onChange={e => setExpires(e.target.value)} />
            </div>
            <button className="btn-primary" disabled={saving} onClick={saveManual}>
              {saving ? 'Sparar…' : 'Spara'}
            </button>
          </>
        )}

        {mode === 'ai' && (
          <>
            <div className="form-group">
              <label className="form-label">Vad köpte du? Vad har du kvar?</label>
              <textarea className="form-input" rows={3} value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                placeholder="T.ex. köpte 1 kg kycklingfilé, pasta, tomatsås. Rester av laxen från igår." />
            </div>
            <button className="btn-primary" disabled={aiLoading || saving} onClick={parsed.length ? saveAll : parseAI}>
              {aiLoading ? 'Tolkar…' : saving ? 'Sparar…' : parsed.length ? `Spara alla (${parsed.length})` : 'Tolka text'}
            </button>
            {aiError && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>Fel: {aiError}</div>}
            {parsed.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                  Hittade {parsed.length} poster – bekräfta:
                </div>
                {parsed.map((p, i) => (
                  <div key={i} className={`pantry-item${p.is_leftover ? ' leftover' : ''}`} style={{ marginBottom: 4 }}>
                    {p.is_leftover && <span className="leftover-badge">REST</span>}
                    <span className="pantry-item-name">{p.item}</span>
                    {p.expires_date && <span className="pantry-item-date">t.o.m. {p.expires_date}</span>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
