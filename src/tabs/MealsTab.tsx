import { GYM_DAYS, MEAL_NAMES } from '../lib/constants'
import { getHolidayName } from '../lib/holidays'
import { dateStr } from '../lib/dates'
import type { MealPlan } from '../types/database'

interface Props {
  meals: MealPlan[]
  onAdd: () => void
  onDelete: (id: string) => void
  onRecipe: (meal: MealPlan) => void
}

function getVisibleDays(): Date[] {
  return Array.from({ length: 4 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    d.setHours(0, 0, 0, 0)
    return d
  })
}

export function MealsTab({ meals, onAdd, onDelete, onRecipe }: Props) {
  const today = dateStr(new Date())
  const visibleDays = getVisibleDays()

  return (
    <div className="card">
<div className="plan-day-list">
        {visibleDays.map((d) => {
          const ds = dateStr(d)
          const dayOfWeek = (d.getDay() + 6) % 7
          const isGym = (GYM_DAYS as readonly number[]).includes(dayOfWeek)
          const holiday = getHolidayName(ds)
          const isToday = ds === today
          const dayMeals = meals.filter(m => m.day === ds)

          return (
            <div
              key={ds}
              className="meal-day-block"
            >
              <div className={`meal-day-header${isGym ? ' gym-day' : ''}${isToday ? ' plan-day-today' : ''}`}>
                <span className="meal-day-name">
                  {d.toLocaleString('sv-SE', { weekday: 'long', day: 'numeric', month: 'numeric' })}
                  {isGym && <span className="gym-badge">GYM</span>}
                  {isToday && <span className="today-badge">Idag</span>}
                  {holiday && <span className="holiday-badge">{holiday}</span>}
                </span>
                <button className="add-btn-icon" onClick={onAdd} title="Lägg till måltid">⊕</button>
              </div>
              <div className="meal-items">
                {dayMeals.length === 0
                  ? <div className="plan-day-rest">Inga måltider planerade</div>
                  : dayMeals.map(m => (
                      <div key={m.id} className="meal-item">
                        <div className="meal-item-inner">
                          <span className="ml">{MEAL_NAMES[m.meal_type] ?? m.meal_type}</span>
                          <div className="meal-item-text">{m.description}</div>
                        </div>
                        <div className="meal-item-actions">
                          <button className="meal-recipe-btn" onClick={() => onRecipe(m)} title="Visa recept">🍳</button>
                          <button className="meal-del" onClick={() => onDelete(m.id)}>✕</button>
                        </div>
                      </div>
                    ))
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
