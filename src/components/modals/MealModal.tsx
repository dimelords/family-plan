import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { claudeCall, parseJson, getApiKey } from '../../lib/claude'
import { dateStr } from '../../lib/dates'
import { MEAL_NAMES, GYM_DAYS } from '../../lib/constants'
import type { MealPlan, Pantry, FamilyMember, PersonPreferences } from '../../types/database'

interface Props {
  open: boolean
  familyId: string
  day: Date | null
  dayIdx: number
  pantry: Pantry[]
  recentMeals: MealPlan[]
  currentMeals: MealPlan[]
  member?: FamilyMember | null
  prefs?: PersonPreferences | null
  onClose: () => void
  onSaved: () => void
}

type Mode = 'manual' | 'ai'
type AISuggestion = { meal_type: string; description: string }

export function MealModal({ open, familyId, day, dayIdx, pantry, recentMeals, currentMeals, member, prefs, onClose, onSaved }: Props) {
  const [mode, setMode] = useState<Mode>('manual')
  const [mealType, setMealType] = useState('F')
  const [description, setDescription] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedTypes, setSavedTypes] = useState<Set<string>>(new Set())

  if (!open || !day) return null

  const isGym = (GYM_DAYS as readonly number[]).includes(dayIdx)
  const ds = dateStr(day)
  const dayName = day.toLocaleString('sv-SE', { weekday: 'long' })
  const leftovers = pantry.filter(p => p.is_leftover)
  const ingredients = pantry.filter(p => !p.is_leftover)

  async function saveManual() {
    if (!description.trim()) return
    setSaving(true)
    await supabase.from('meal_plan').insert({ family_id: familyId, day: ds, meal_type: mealType, description: description.trim() })
    setSaving(false)
    setDescription('')
    onSaved()
  }

  async function askAI() {
    if (!getApiKey()) { setAiError('Ingen API-nyckel. Lägg till under ⚙️'); return }
    setAiLoading(true); setAiError(''); setAiSuggestions([])
    const allRecent = [...recentMeals, ...currentMeals].slice(-14)
    const recentStr = allRecent.map(m => `${m.day} ${m.meal_type}: ${m.description}`).join('\n')
    // Build person-specific nutrition context from prefs
    const name = member?.name ?? 'familjemedlemmen'
    const gender = prefs?.gender ?? null
    const heightCm = prefs?.height_cm ?? null
    const goal = prefs?.meal_goal ?? null
    const mealGoals = prefs?.meal_goals ?? (goal ? [goal] : [])

    // Mifflin-St Jeor BMR estimate (if we have height; assume moderate activity)
    // We don't store weight in prefs so we use a reasonable default
    // TDEE ≈ BMR × 1.55 (moderately active)
    let tdeeHint = ''
    if (heightCm) {
      // Without weight: rough range based on height + gender
      if (gender === 'male') {
        tdeeHint = `Uppskattad TDEE: 2400–2800 kcal/dag (träningsdag +200–300 kcal)`
      } else if (gender === 'female') {
        tdeeHint = `Uppskattad TDEE: 1800–2200 kcal/dag (träningsdag +150–250 kcal)`
      }
    }

    // Combine meal goals + training goals to determine nutrition strategy
    const trainingGoals = prefs?.training_goals ?? (prefs?.training_goal ? [prefs.training_goal] : [])
    const allGoals = [...new Set([...mealGoals, ...trainingGoals])]
    const wantsLoss   = allGoals.includes('weight_loss')
    const wantsMuscle = allGoals.includes('muscle_gain')
    const isRecomp    = wantsLoss && wantsMuscle

    const goalContext = isRecomp
      ? 'Mål: body recomp (bygga muskler + gå ner i vikt samtidigt) – litet kaloriunderskott ~150–250 kcal, mycket hög protein (2,2–2,4 g/kg), kolhydrater främst kring träning. Prioritera proteinrika måltider med hög mättnad och lågt energitäthet.'
      : wantsMuscle
        ? 'Mål: muskelbygge – kaloriöverskott ~200–300 kcal, hög protein (2,0–2,2 g/kg), rikligt med kolhydrater kring träning'
        : wantsLoss
          ? 'Mål: fettförbränning – kaloriunderskott ~300–500 kcal, hög protein (2,0–2,4 g/kg) för att bevara muskler, fiberrik mat för mättnad'
          : allGoals.includes('endurance')
            ? 'Mål: uthållighet – högt kolhydratintag, måttlig protein, fokus på återhämtning'
            : 'Mål: bibehålla vikt och hälsa – balanserade makros, god mättnad, varierad kost'

    const gymDayContext = isGym
      ? `TRÄNINGSDAG – viktigt:\n- Äta 1–2h FÖRE pass: 20–40g protein + 40–80g snabba kolhydrater\n- Inom 2h EFTER pass: 25–40g protein + 50–100g kolhydrater för återhämtning\n- Lite extra kalorier och kol totalt idag`
      : 'Vilodagar: normalt kaloriintag, prioritera proteinrika måltider och fiber'

    const system = `Du är en evidensbaserad kostrådgivare för ${name}.
${tdeeHint}
${goalContext}
${gymDayContext}

Vetenskapliga riktlinjer du följer:
- Protein: fördela jämnt över 3–4 måltider (20–40g per måltid aktiverar muskelproteinsyntesen optimalt)
- Fiber: 25–35g/dag för mättnad och tarmhälsa – prioritera grönsaker, baljväxter, fullkorn
- Kostfetter: inkludera omega-3 (lax, sardiner, linfrön) för anti-inflammation och återhämtning
- Kalcium och D-vitamin: viktigt för benhälsa – mejeriprodukter, berikade alternativ, fet fisk
- Måltidstiming: kolhydrater kring träning, protein jämnt fördelat hela dagen

Svara BARA med JSON utan markdown.`
    const prompt = `Ge 3 måltidsförslag för ${dayName} (${ds}).
${aiPrompt ? `Önskemål: ${aiPrompt}` : ''}
${leftovers.length ? `VIKTIGT – använd gärna dessa rester: ${leftovers.map(p => p.item).join(', ')}` : ''}
${ingredients.length ? `Hemma finns: ${ingredients.map(p => p.item).join(', ')}` : ''}
${recentStr ? `Senaste måltider (undvik upprepning):\n${recentStr}` : ''}
Svara exakt som JSON-array (3 objekt):
[{"meal_type":"F","description":"..."},{"meal_type":"L","description":"..."},{"meal_type":"M","description":"..."}]
F=Frukost, L=Lunch, M=Middag. Max 65 tecken per description.`
    try {
      const text = await claudeCall(system, prompt, 400)
      setAiSuggestions(parseJson<AISuggestion[]>(text))
    } catch (e) { setAiError((e as Error).message) }
    setAiLoading(false)
  }

  async function selectSuggestion(s: AISuggestion) {
    setSaving(true)
    await supabase.from('meal_plan').insert({ family_id: familyId, day: ds, meal_type: s.meal_type, description: s.description })
    setSavedTypes(prev => new Set([...prev, s.meal_type]))
    setSaving(false)
  }

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Måltid – {dayName}</div>
          <button className="modal-close" onClick={() => { if (savedTypes.size > 0) onSaved(); else onClose(); }}>✕</button>
        </div>
        <div className="mode-tabs">
          <button className={`mode-tab${mode === 'manual' ? ' active' : ''}`} onClick={() => setMode('manual')}>Manuell</button>
          <button className={`mode-tab${mode === 'ai' ? ' active' : ''}`} onClick={() => setMode('ai')}>✨ AI-förslag</button>
        </div>

        {mode === 'manual' && (
          <>
            <div className="form-group">
              <label className="form-label">Måltid</label>
              <select className="form-select" value={mealType} onChange={e => setMealType(e.target.value)}>
                {Object.entries(MEAL_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Beskrivning</label>
              <input className="form-input" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="T.ex. Kycklingpasta med sallad" />
            </div>
            <button className="btn-primary" disabled={saving} onClick={saveManual}>
              {saving ? 'Sparar…' : 'Spara'}
            </button>
          </>
        )}

        {mode === 'ai' && (
          <>
            <div className="form-group">
              <label className="form-label">Önskemål (valfritt)</label>
              <input className="form-input" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                placeholder="T.ex. något snabbt, vegetariskt…" />
            </div>
            {(leftovers.length > 0 || ingredients.length > 0) && (
              <div className="ai-context-preview">
                AI:n känner till:
                {leftovers.length > 0 && <><br /><strong>Rester:</strong> {leftovers.map(p => p.item).join(', ')}</>}
                {ingredients.length > 0 && <><br /><strong>Hemma:</strong> {ingredients.slice(0, 6).map(p => p.item).join(', ')}{ingredients.length > 6 ? '…' : ''}</>}
              </div>
            )}
            <button className="btn-primary" disabled={aiLoading} onClick={askAI}>
              {aiLoading ? 'Tänker…' : 'Generera förslag'}
            </button>
            {aiError && <div className="ai-thinking" style={{ color: 'var(--danger)', marginTop: 8 }}>Fel: {aiError}</div>}
            {aiSuggestions.length > 0 && (
              <div className="ai-suggestions" style={{ marginTop: 10 }}>
                {aiSuggestions.map(s => {
                  const usesRest = leftovers.some(l => s.description.toLowerCase().includes(l.item.toLowerCase().split(' ')[0]))
                  return (
                    <div key={s.meal_type} className="ai-suggestion">
                      <div className="ai-sug-body">
                        <span className="ai-sug-label">{MEAL_NAMES[s.meal_type]}{usesRest ? ' 🍱' : ''}</span>
                        <span className="ai-sug-text">{s.description}</span>
                      </div>
                      {savedTypes.has(s.meal_type) ? (
                        <span className="ai-sug-saved">✓ Tillagd</span>
                      ) : (
                        <button
                          className="ai-sug-add-btn"
                          disabled={saving}
                          onClick={() => selectSuggestion(s)}
                        >
                          {saving ? '…' : '+ Lägg till'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
