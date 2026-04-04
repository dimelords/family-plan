import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { claudeCall, parseJson, getApiKey } from '../../lib/claude'
import { dateStr } from '../../lib/dates'
import { FULL_DAY_NAMES } from '../../lib/constants'
import type { PersonPreferences, TrainingPlan, TrainingSession, Exercise } from '../../types/database'

interface Props {
  open: boolean
  familyId: string
  person: string
  prefs: PersonPreferences
  previousPlan: TrainingPlan | null
  onClose: () => void
  onSaved: () => void
}

const GOAL_LABELS: Record<string, string> = {
  muscle_gain: 'bygga muskler', weight_loss: 'gå ner i vikt',
  endurance: 'förbättra uthållighet', general_fitness: 'allmän hälsa',
}
const EXP_LABELS: Record<string, string> = {
  beginner: 'nybörjare (< 1 år)', intermediate: 'medel (1–3 år)', advanced: 'erfaren (3+ år)',
}

function getStartDate(): Date {
  const d = new Date()
  // Default to next Monday
  const day = d.getDay()
  const diff = day === 0 ? 1 : 8 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

type AISession = { day_offset: number; workout_type: string; exercises: Exercise[]; notes: string }

export function GeneratePlanModal({ open, familyId, person, prefs, previousPlan, onClose, onSaved }: Props) {
  const [startDate, setStartDate] = useState(() => dateStr(getStartDate()))
  const [extraContext, setExtraContext] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<AISession[] | null>(null)
  const [error, setError] = useState('')

  if (!open) return null

  const age = prefs.date_of_birth
    ? new Date().getFullYear() - new Date(prefs.date_of_birth).getFullYear()
    : null
  const prefDayNames = (prefs.preferred_training_days ?? []).map(d => FULL_DAY_NAMES[d]).join(', ')

  async function generate() {
    if (!getApiKey()) { setError('Ingen API-nyckel. Lägg till under ⚙️'); return }
    setGenerating(true); setError(''); setPreview(null)

    const system = `Du är en certifierad träningsexpert med djup kunskap om 2025 träningsvetenskap för hypertrofi och styrka.

## Vetenskapliga principer du ALLTID följer

**Progressiv överbelastning (primär drivkraft):**
- Öka antalet reps ELLER vikten varje vecka – båda ger liknande hypertrofi
- Spåra: vecka 1→2→3 progressivt svårare, vecka 4 = deload

**Volymlankmarks per muskelgrupp per vecka:**
- Minsta effektiva volym (MEV): 10–12 set
- Optimal tillväxt: 12–20 set  
- Maximalt återhämtningsbart (MRV): 20–25 set
- Börja vid MEV, bygg mot optimal

**Intensitetszoner:**
- Styrka: 1–6 reps @ 85–100% 1RM, 3–5 min vila
- Hypertrofi (primär zon): 6–12 reps @ 70–85% 1RM, 2–3 min vila
- Metabolisk/pump: 12–20+ reps @ 60–70% 1RM, 1–2 min vila

**Övningsurval:**
- Compound-övningar ALLTID först i passet (knäböj, marklyft, bänkpress, axelpress, rodd)
- 3–5 compound-övningar + 2–4 isolationsövningar per pass
- Full rörelsebana för maximal muskelstimulering

**Splittval efter erfarenhet:**
- Nybörjare (< 1 år): Helkropp 3x/vecka (A/B-variation) – tränar varje muskelgrupp 3x/v
- Medel (1–3 år): Överkropp/Underkropp 4x/vecka – 2x per muskelgrupp
- Erfaren (3+ år): Push/Pull/Ben 6x/vecka – 2x per muskelgrupp med varierad intensitet

**4-veckors periodisering:**
- Vecka 1: Introduktion/teknik, lägre intensitet, bygg MEV
- Vecka 2: Volymökning, lägg till 1–2 set per pass
- Vecka 3: Intensitetstopp, tyngst vecka
- Vecka 4: DELOAD – reducera volym 40–50%, behåll intensitet, aktiv återhämtning

**Biomek/form-cues att inkludera i notes:**
- Knäböj: "Sprid golvet, knän utåt, bröst uppåt"
- Marklyft: "Lats täta, tryck golvet ifrån dig, höfter och axlar stiger jämnt"
- Bänkpress: "Skulderblad intryckta, bendriv, sänk till nippellinjen"
- Axelpress: "Kläm sätesmusklerna, armbågar lätt framåt"

Svara BARA med JSON-array utan markdown-kodblock.`

    const expSplit = prefs.experience_level === 'beginner'
      ? 'Helkropp A/B (3 dagar/vecka) – tränar varje muskelgrupp 3 gånger'
      : prefs.experience_level === 'intermediate'
        ? 'Överkropp/Underkropp (4 dagar/vecka) – varje muskelgrupp 2 gånger'
        : 'Push/Pull/Ben (6 dagar/vecka) – undulerende periodisering'

    const prevInfo = previousPlan
      ? `\nFörra perioden: ${previousPlan.start_date}–${previousPlan.end_date}. Mål: ${previousPlan.goal_snapshot ?? 'okänt'}. Öka volym/intensitet från det.`
      : '\nDetta är personens FÖRSTA träningsplan – börja konservativt vid MEV.'

    const prompt = `Skapa en evidensbaserad 4-veckors träningsplan för:

**Profil:**
- Namn: ${person}
${age ? `- Ålder: ${age} år` : ''}
${prefs.height_cm ? `- Längd: ${prefs.height_cm} cm` : ''}
${prefs.gender ? `- Kön: ${prefs.gender === 'male' ? 'man' : prefs.gender === 'female' ? 'kvinna' : 'annat'}` : ''}
- Mål: ${(prefs.training_goals?.length ? prefs.training_goals : prefs.training_goal ? [prefs.training_goal] : []).map(g => GOAL_LABELS[g] ?? g).join(' + ') || 'ej angivet'}
${prefs.training_goals?.includes('muscle_gain') && prefs.training_goals?.includes('weight_loss') ? '  ⚠️ Body recomp (bygga muskler + gå ner i vikt): kräver hög protein (2,2–2,4g/kg), liten kaloriunderskott, tung styrketräning\n' : ''}
- Erfarenhetsnivå: ${EXP_LABELS[prefs.experience_level ?? ''] ?? prefs.experience_level}
- Rekommenderad split: ${expSplit}
- Föredragna träningsdagar: ${prefDayNames || 'flexibelt – välj optimala dagar för spliten'}
${prevInfo}
${extraContext ? `\nExtra önskemål/begränsningar: ${extraContext}` : ''}

**Krav på planen:**
- Vecka 1–3: Progressivt svårare (fler reps ELLER mer vikt varje vecka på samma övningar)
- Vecka 4: Deload – behåll samma övningar men 40–50% lägre volym (färre set), lite lättare
- Compound-övningar ALLTID först i varje pass
- Sets/reps: använd format "4x8-10" (set x reps-intervall)
- notes på övningsnivå: inkludera viktiga form-cues på svenska
- notes på passnivå: berätta vad fokus är (t.ex. "Vecka 2 – lägg till 1 rep per set")

Returnera JSON-array där day_offset=0 är startdatum, day_offset=1 nästa dag osv:
[{"day_offset":0,"workout_type":"Helkropp A","exercises":[{"name":"Knäböj","sets":4,"reps":"8-10","notes":"Sprid golvet, knän utåt"},...],"notes":"Vecka 1 – lär in rörelserna, fokus på teknik"},...]

Inkludera ALLA pass för alla 4 veckor. Returnera bara JSON-array.`

    try {
      const text = await claudeCall(system, prompt, 3000)
      setPreview(parseJson<AISession[]>(text))
    } catch (e) { setError((e as Error).message) }
    setGenerating(false)
  }

  async function savePlan() {
    if (!preview) return
    setSaving(true)
    const start = new Date(startDate)
    const end = new Date(startDate)
    end.setDate(end.getDate() + 27) // 4 weeks

    const { data: plan } = await supabase
      .from('training_plans')
      .insert({
        family_id: familyId,
        person,
        start_date: dateStr(start),
        end_date: dateStr(end),
        goal_snapshot: `${(prefs.training_goals?.length ? prefs.training_goals : prefs.training_goal ? [prefs.training_goal] : []).map(g => GOAL_LABELS[g] ?? g).join(' + ') || '–'}, ${EXP_LABELS[prefs.experience_level ?? ''] ?? prefs.experience_level}${extraContext ? ', ' + extraContext : ''}`,
      })
      .select()
      .single()

    if (!plan) { setSaving(false); return }

    const sessionRows: Omit<TrainingSession, 'id' | 'created_at'>[] = preview.map(s => {
      const d = new Date(startDate)
      d.setDate(d.getDate() + s.day_offset)
      return {
        plan_id: plan.id,
        family_id: familyId,
        person,
        scheduled_date: dateStr(d),
        workout_type: s.workout_type,
        exercises: s.exercises,
        notes: s.notes || null,
        completed: false,
      }
    })

    await supabase.from('training_sessions').insert(sessionRows)
    setSaving(false)
    onSaved()
  }

  const weekGroups = preview
    ? [0, 1, 2, 3].map(w => ({
        week: w + 1,
        sessions: preview.filter(s => Math.floor(s.day_offset / 7) === w),
      }))
    : []

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">🏋️ Generera träningsplan</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {!preview ? (
          <>
            <div className="plan-context-box">
              <div className="plan-context-row"><span>Mål</span><span>{(prefs.training_goals?.length ? prefs.training_goals : prefs.training_goal ? [prefs.training_goal] : []).map(g => GOAL_LABELS[g] ?? g).join(' + ') || '–'}</span></div>
              <div className="plan-context-row"><span>Erfarenhet</span><span>{EXP_LABELS[prefs.experience_level ?? ''] ?? '–'}</span></div>
              <div className="plan-context-row"><span>Föredragna dagar</span><span>{prefDayNames || '–'}</span></div>
              {previousPlan && <div className="plan-context-row"><span>Förra planen</span><span>{previousPlan.start_date}</span></div>}
            </div>

            <div className="form-group">
              <label className="form-label">Startdatum</label>
              <input className="form-input" type="date" value={startDate}
                onChange={e => setStartDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="form-group">
              <label className="form-label">Extra önskemål (valfritt)</label>
              <input className="form-input" value={extraContext}
                onChange={e => setExtraContext(e.target.value)}
                placeholder="T.ex. ont i knät, vill ha mer bröst, hemmaträning…" />
            </div>
            {error && <div className="ai-thinking" style={{ color: 'var(--danger)' }}>{error}</div>}
            <button className="btn-primary" disabled={generating} onClick={generate}>
              {generating ? '✨ Genererar 4-veckorsplan…' : '✨ Generera plan'}
            </button>
          </>
        ) : (
          <>
            <div className="plan-preview-header">
              ✅ Plan klar — {preview.length} pass över 4 veckor
            </div>
            <div className="plan-weeks">
              {weekGroups.map(({ week, sessions }) => (
                <div key={week} className="plan-week-block">
                  <div className="plan-week-label">Vecka {week}{week === 4 ? ' (deload)' : ''}</div>
                  {sessions.map((s, i) => (
                    <div key={i} className="plan-preview-session">
                      <div className="plan-preview-type">{s.workout_type}</div>
                      <div className="plan-preview-exercises">
                        {s.exercises.slice(0, 3).map((e, j) => (
                          <span key={j} className="plan-preview-ex">{e.name} {e.sets}×{e.reps}</span>
                        ))}
                        {s.exercises.length > 3 && <span className="plan-preview-ex muted">+{s.exercises.length - 3} till</span>}
                      </div>
                      {s.notes && <div className="plan-preview-notes">{s.notes}</div>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn-secondary" onClick={() => setPreview(null)}>← Generera om</button>
              <button className="btn-primary" style={{ flex: 1 }} disabled={saving} onClick={savePlan}>
                {saving ? 'Sparar…' : 'Spara plan'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
