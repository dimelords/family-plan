import { useState } from 'react'
import { DAY_NAMES } from '../../lib/constants'
import type { FamilyMember, PersonPreferences } from '../../types/database'

interface Props {
  open: boolean
  member: FamilyMember
  onDone: (prefs: Partial<PersonPreferences>) => void
}

type Step = 'basic' | 'training' | 'meals' | 'done'

const TRAINING_GOALS = [
  { value: 'muscle_gain',      label: '💪 Bygga muskler' },
  { value: 'weight_loss',      label: '🔥 Gå ner i vikt' },
  { value: 'endurance',        label: '🏃 Uthållighet' },
  { value: 'general_fitness',  label: '⚡ Allmän hälsa' },
]
const MEAL_GOALS = [
  { value: 'weight_loss',   label: '🔥 Gå ner i vikt' },
  { value: 'muscle_gain',   label: '💪 Bygga muskler' },
  { value: 'maintenance',   label: '⚖️ Hålla vikten' },
]
const EXPERIENCE = [
  { value: 'beginner',      label: 'Nybörjare (< 1 år)' },
  { value: 'intermediate',  label: 'Medel (1–3 år)' },
  { value: 'advanced',      label: 'Erfaren (3+ år)' },
]

export function OnboardingModal({ open, member, onDone }: Props) {
  const [step, setStep] = useState<Step>('basic')

  // Step 1 – basic
  const [dob, setDob] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('')

  // Step 2 – training
  const [wantsTraining, setWantsTraining] = useState<boolean | null>(null)
  const [trainingGoals, setTrainingGoals] = useState<string[]>([])
  const [experience, setExperience] = useState('')
  const [prefDays, setPrefDays] = useState<number[]>([])
  const [wakeTime, setWakeTime] = useState('07:00')
  const [trainingTime, setTrainingTime] = useState('11:00')

  // Step 3 – meals
  const [wantsMealAI, setWantsMealAI] = useState<boolean | null>(null)
  const [mealGoals, setMealGoals] = useState<string[]>([])

  if (!open) return null

  function toggleDay(d: number) {
    setPrefDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())
  }

  function isMinor() {
    if (!dob) return false
    const age = new Date().getFullYear() - new Date(dob).getFullYear()
    return age < 18
  }

  function buildPrefs(): Partial<PersonPreferences> {
    return {
      date_of_birth: dob || null,
      height_cm: height ? parseFloat(height) : null,
      weight_kg: weight ? parseFloat(weight) : null,
      gender: (gender || null) as PersonPreferences['gender'],
      enable_training: wantsTraining ?? true,
      training_goal: (wantsTraining && trainingGoals.length > 0 ? trainingGoals[0] : null) as PersonPreferences['training_goal'],
      training_goals: wantsTraining ? trainingGoals : [],
      experience_level: (wantsTraining && experience ? experience : null) as PersonPreferences['experience_level'],
      preferred_training_days: wantsTraining ? prefDays : [],
      wake_time: wakeTime || null,
      preferred_training_time: wantsTraining ? (trainingTime || null) : null,
      enable_nutrition_ai: isMinor() ? false : (wantsMealAI ?? true),
      meal_goal: (wantsMealAI && mealGoals.length > 0 ? mealGoals[0] : null) as PersonPreferences['meal_goal'],
      meal_goals: wantsMealAI ? mealGoals : [],
      enable_body_tracking: false,
      onboarding_completed: true,
    }
  }

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Hej, {member.name}! 👋</div>
          <div className="onboarding-step-indicator">
            {(['basic','training','meals','done'] as Step[]).map((s) => (
              <div key={s} className={`step-dot${step === s ? ' active' : ''}`} />
            ))}
          </div>
        </div>

        {step === 'basic' && (
          <>
            <p className="onboarding-desc">Låt oss lära känna dig lite så att AI:n kan ge bra förslag.</p>
            <div className="form-group">
              <label className="form-label">Födelsedatum</label>
              <input className="form-input" type="date" value={dob}
                onChange={e => setDob(e.target.value)} max={new Date().toISOString().slice(0,10)} />
            </div>
            <div className="form-group">
              <label className="form-label">Längd (cm)</label>
              <input className="form-input" type="number" value={height} placeholder="178"
                onChange={e => setHeight(e.target.value)} min={100} max={250} />
            </div>
            <div className="form-group">
              <label className="form-label">Vikt (kg)</label>
              <input className="form-input" type="number" value={weight} placeholder="80"
                onChange={e => setWeight(e.target.value)} min={30} max={300} step={0.5} />
            </div>
            <div className="form-group">
              <label className="form-label">Kön</label>
              <div className="pill-row">
                {(['male','female','other'] as const).map(g => (
                  <button key={g} className={`pill${gender === g ? ' active' : ''}`} onClick={() => setGender(g)}>
                    {g === 'male' ? 'Man' : g === 'female' ? 'Kvinna' : 'Annat'}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-primary" disabled={!dob || !height || !gender}
              onClick={() => setStep(isMinor() ? 'done' : 'training')}>
              Nästa →
            </button>
            {isMinor() && dob && (
              <p style={{fontSize:11,color:'var(--muted)',marginTop:8,textAlign:'center'}}>
                Du är under 18 — avancerade funktioner aktiveras av en vuxen i familjen.
              </p>
            )}
          </>
        )}

        {step === 'training' && (
          <>
            <p className="onboarding-desc">Vill du ha en AI-genererad träningsplan?</p>
            <div className="pill-row" style={{marginBottom:16}}>
              <button className={`pill${wantsTraining === true ? ' active' : ''}`} onClick={() => setWantsTraining(true)}>Ja tack!</button>
              <button className={`pill${wantsTraining === false ? ' active' : ''}`} onClick={() => setWantsTraining(false)}>Nej, hoppa över</button>
            </div>

            {wantsTraining && (
              <>
                <div className="form-group">
                  <label className="form-label">Träningsmål <span className="form-label-hint">(välj gärna flera)</span></label>
                  <div className="pill-row wrap">
                    {TRAINING_GOALS.map(g => (
                      <button key={g.value}
                        className={`pill${trainingGoals.includes(g.value) ? ' active' : ''}`}
                        onClick={() => setTrainingGoals(prev =>
                          prev.includes(g.value) ? prev.filter(v => v !== g.value) : [...prev, g.value]
                        )}>{g.label}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Erfarenhet</label>
                  <div className="pill-row wrap">
                    {EXPERIENCE.map(e => (
                      <button key={e.value} className={`pill${experience === e.value ? ' active' : ''}`}
                        onClick={() => setExperience(e.value)}>{e.label}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Föredragna träningsdagar</label>
                  <div className="day-pill-row">
                    {DAY_NAMES.map((name, i) => (
                      <button key={i} className={`day-pill${prefDays.includes(i) ? ' active' : ''}`}
                        onClick={() => toggleDay(i)}>{name}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Vilken tid tränar du vanligtvis?</label>
                  <input className="form-input" type="time" value={trainingTime}
                    onChange={e => setTrainingTime(e.target.value)} />
                </div>
              </>
            )}
            <div className="form-group">
              <label className="form-label">Vilken tid vaknar du vanligtvis?</label>
              <input className="form-input" type="time" value={wakeTime}
                onChange={e => setWakeTime(e.target.value)} />
            </div>

            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn-secondary" onClick={() => setStep('basic')}>← Tillbaka</button>
              <button className="btn-primary" style={{flex:1}}
                disabled={wantsTraining === null || (wantsTraining && (trainingGoals.length === 0 || !experience))}
                onClick={() => setStep('meals')}>Nästa →</button>
            </div>
          </>
        )}

        {step === 'meals' && (
          <>
            <p className="onboarding-desc">Vill du ha AI-förslag på mat och måltidsplanering?</p>
            <div className="pill-row" style={{marginBottom:16}}>
              <button className={`pill${wantsMealAI === true ? ' active' : ''}`} onClick={() => setWantsMealAI(true)}>Ja tack!</button>
              <button className={`pill${wantsMealAI === false ? ' active' : ''}`} onClick={() => setWantsMealAI(false)}>Nej, hoppa över</button>
            </div>
            {wantsMealAI && (
              <div className="form-group">
                <label className="form-label">Kostmål <span className="form-label-hint">(välj gärna flera)</span></label>
                <div className="pill-row wrap">
                  {MEAL_GOALS.map(g => (
                    <button key={g.value}
                      className={`pill${mealGoals.includes(g.value) ? ' active' : ''}`}
                      onClick={() => setMealGoals(prev =>
                        prev.includes(g.value) ? prev.filter(v => v !== g.value) : [...prev, g.value]
                      )}>{g.label}</button>
                  ))}
                </div>
              </div>
            )}
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn-secondary" onClick={() => setStep('training')}>← Tillbaka</button>
              <button className="btn-primary" style={{flex:1}}
                disabled={wantsMealAI === null || (wantsMealAI && mealGoals.length === 0)}
                onClick={() => setStep('done')}>Nästa →</button>
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <div style={{textAlign:'center',padding:'20px 0'}}>
              <div style={{fontSize:48,marginBottom:12}}>🎉</div>
              <p style={{fontSize:16,fontWeight:600,marginBottom:8}}>Allt klart, {member.name}!</p>
              <p style={{fontSize:13,color:'var(--muted)'}}>
                Du kan alltid ändra dina inställningar under ⚙️.
              </p>
            </div>
            <button className="btn-primary" onClick={() => onDone(buildPrefs())}>Kom igång!</button>
          </>
        )}
      </div>
    </div>
  )
}
