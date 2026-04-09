import { useEffect, useRef, useState } from 'react'
import { claudeCall, parseJson } from '../../lib/claude'
import { supabase } from '../../lib/supabase'
import { useWakeLock } from '../../hooks/useWakeLock'
import type { MealPlan } from '../../types/database'
import type { Recipe, RecipeIngredient, RecipeStep } from '../../types/database'

interface Props {
  open: boolean
  meal: MealPlan | null
  familyId: string
  onClose: () => void
}

const SYSTEM_PROMPT = `Du är en kock. Returnera receptet som JSON med exakt dessa fält:
{
  "title": "string",
  "description": "string (kort beskrivning, 1 mening, max 12 ord, på svenska)",
  "servings": number,
  "ingredients": [{ "name": "string", "amount": number, "unit": "string" }],
  "steps": [{ "title": "string", "description": "string", "timer_seconds": number | null }]
}
Inga markdown-fences. Bara JSON. Alla strängar på svenska.`

function mealEmoji(desc: string): string {
  const d = desc.toLowerCase()
  if (/pasta|spagetti|lasagne|ravioli|rigatoni|tagliatelle/.test(d)) return '🍝'
  if (/pizza/.test(d)) return '🍕'
  if (/kyckling|chicken/.test(d)) return '🍗'
  if (/lax|tonfisk|fisk|räkor|skaldjur/.test(d)) return '🐟'
  if (/sallad/.test(d)) return '🥗'
  if (/soppa|sopa/.test(d)) return '🍲'
  if (/biff|kött|stek|hamburgare|köttfärs/.test(d)) return '🥩'
  if (/ägg|shakshuka|omelett/.test(d)) return '🍳'
  if (/ris|curry/.test(d)) return '🍛'
  if (/tacos|burrito|quesadilla/.test(d)) return '🌮'
  if (/smörgås|toast|macka|sandwich/.test(d)) return '🥪'
  if (/wok/.test(d)) return '🥡'
  if (/grönsak|vegetarisk|vegan|tofu/.test(d)) return '🥦'
  if (/frukost|havregryn|gröt/.test(d)) return '🥣'
  if (/pannkaka|våffla/.test(d)) return '🥞'
  if (/sushi|maki|nigiri/.test(d)) return '🍱'
  return '🍽️'
}

export function RecipeModal({ open, meal, familyId, onClose }: Props) {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [servings, setServings] = useState(4)
  const [activeTimer, setActiveTimer] = useState<{ idx: number; remaining: number } | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useWakeLock(open)

  useEffect(() => {
    if (!open || !meal) return
    setRecipe(null)
    setError(null)
    setServings(4)
    setActiveTimer(null)
    loadOrGenerate(meal)
  }, [open, meal?.id])

  // Cleanup timer on close
  useEffect(() => {
    if (!open) {
      if (timerRef.current) clearInterval(timerRef.current)
      setActiveTimer(null)
    }
  }, [open])

  async function loadOrGenerate(meal: MealPlan) {
    setLoading(true)
    try {
      // Check cache
      const { data: existing } = await supabase
        .from('recipes')
        .select('title, servings, ingredients, steps')
        .eq('family_id', familyId)
        .eq('source_description', meal.description)
        .maybeSingle()

      if (existing) {
        const r = existing as unknown as Recipe
        setRecipe(r)
        setServings(r.servings)
        return
      }

      // Generate via Claude
      const raw = await claudeCall(
        SYSTEM_PROMPT,
        `Skapa ett recept för: "${meal.description}"`,
        1200,
      )
      const generated = parseJson<Recipe>(raw)

      // Save to DB
      await supabase.from('recipes').insert({
        family_id: familyId,
        source_description: meal.description,
        title: generated.title,
        servings: generated.servings,
        ingredients: generated.ingredients as unknown as never,
        steps: generated.steps as unknown as never,
      })

      setRecipe(generated)
      setServings(generated.servings)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Något gick fel')
    } finally {
      setLoading(false)
    }
  }

  function scaleAmount(amount: number): string {
    if (!recipe) return String(amount)
    const scaled = (amount * servings) / recipe.servings
    // Show integer if clean, otherwise 1 decimal
    return scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1)
  }

  function startTimer(idx: number, seconds: number) {
    if (timerRef.current) clearInterval(timerRef.current)
    setActiveTimer({ idx, remaining: seconds })
    timerRef.current = setInterval(() => {
      setActiveTimer(prev => {
        if (!prev || prev.remaining <= 1) {
          clearInterval(timerRef.current!)
          return null
        }
        return { ...prev, remaining: prev.remaining - 1 }
      })
    }, 1000)
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    setActiveTimer(null)
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
  }

  if (!open) return null

  return (
    <div className="modal-overlay open recipe-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal recipe-modal">
        {loading && (
          <div className="recipe-loading">
            <button className="modal-close recipe-close-btn" onClick={onClose}>✕</button>
            <div className="recipe-hero-emoji" style={{ fontSize: 56 }}>{mealEmoji(meal?.description ?? '')}</div>
            <div className="spinner" />
            <p>Genererar recept…</p>
          </div>
        )}

        {error && (
          <div className="recipe-error">
            <button className="modal-close recipe-close-btn" onClick={onClose}>✕</button>
            <p>⚠️ {error}</p>
            {meal && <button className="btn-secondary" onClick={() => loadOrGenerate(meal)}>Försök igen</button>}
          </div>
        )}

        {recipe && !loading && (
          <>
            {/* Hero */}
            <div className="recipe-hero">
              <button className="modal-close recipe-close-btn" onClick={onClose}>✕</button>
              <div className="recipe-hero-emoji">{mealEmoji(meal?.description ?? '')}</div>
              <h2 className="recipe-title">{recipe.title}</h2>
              <p className="recipe-tagline">{recipe.description ?? meal?.description}</p>
            </div>

            {/* Servings */}
            <div className="recipe-servings">
              <span className="recipe-servings-label">Portioner</span>
              <div className="recipe-servings-ctrl">
                <button className="servings-btn" onClick={() => setServings(s => Math.max(1, s - 1))}>−</button>
                <span className="servings-val">{servings}</span>
                <button className="servings-btn" onClick={() => setServings(s => s + 1)}>+</button>
              </div>
            </div>

            {/* Ingredients */}
            <section className="recipe-section">
              <h3 className="recipe-section-title">Ingredienser</h3>
              <ul className="recipe-ingredients">
                {(recipe.ingredients as RecipeIngredient[]).map((ing, i) => (
                  <li key={i} className="recipe-ingredient">
                    <span className="ing-amount">{scaleAmount(ing.amount)} {ing.unit}</span>
                    <span className="ing-name">{ing.name}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Steps */}
            <section className="recipe-section">
              <h3 className="recipe-section-title">Tillvägagångssätt</h3>
              <ol className="recipe-steps">
                {(recipe.steps as RecipeStep[]).map((step, i) => {
                  const isActive = activeTimer?.idx === i
                  return (
                    <li key={i} className={`recipe-step${isActive ? ' recipe-step-active' : ''}`}>
                      <div className="step-number">{i + 1}</div>
                      <div className="step-body">
                        <div className="step-title">{step.title}</div>
                        <div className="step-desc">{step.description}</div>
                        {step.timer_seconds && step.timer_seconds > 0 && (
                          <div className="step-timer">
                            {isActive ? (
                              <>
                                <span className="timer-countdown">{formatTime(activeTimer!.remaining)}</span>
                                <button className="timer-btn timer-stop" onClick={stopTimer}>■ Stoppa</button>
                              </>
                            ) : (
                              <button className="timer-btn" onClick={() => startTimer(i, step.timer_seconds!)}>
                                ⏱ {formatTime(step.timer_seconds)}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
