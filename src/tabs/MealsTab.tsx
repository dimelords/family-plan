import { useEffect, useRef } from 'react'
import { GYM_DAYS, FULL_DAY_NAMES, MEAL_NAMES } from '../lib/constants'
import { getHolidayName } from '../lib/holidays'
import { dateStr } from '../lib/dates'
import type { MealPlan } from '../types/database'

interface Props {
  days: Date[]
  meals: MealPlan[]
  onAdd: () => void
  onDelete: (id: string) => void
  onRecipe: (meal: MealPlan) => void
}

export function MealsTab({ days, meals, onAdd, onDelete, onRecipe }: Props) {
  const todayRef = useRef<HTMLDivElement>(null)
  const today = dateStr(new Date())

  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'instant', block: 'start' })
    }
  }, [])

  return (
    <div className="card">
      <div className="sec-label">
        Måltidsplan
        <button className="add-btn" onClick={onAdd}>+ Lägg till</button>
      </div>
      <div className="plan-day-list">
        {days.map((d, i) => {
          const ds = dateStr(d)
          const isGym = (GYM_DAYS as readonly number[]).includes(i)
          const holiday = getHolidayName(ds)
          const isToday = ds === today
          const isPast = ds < today
          const dayMeals = meals.filter(m => m.day === ds)

          return (
            <div
              key={ds}
              ref={isToday ? todayRef : undefined}
              className={`meal-day-block${isPast ? ' plan-day-past' : ''}`}
            >
              <div className={`meal-day-header${isGym ? ' gym-day' : ''}${isToday ? ' plan-day-today' : ''}`}>
                {FULL_DAY_NAMES[i]}
                {isGym && <span className="gym-badge">GYM</span>}
                {isToday && <span className="today-badge">Idag</span>}
                {holiday && <span className="holiday-badge">{holiday}</span>}
              </div>
              <div className="meal-items">
                {dayMeals.length === 0
                  ? <div className="plan-day-rest">Inga måltider planerade</div>
                  : dayMeals.map(m => (
                      <div key={m.id} className="meal-item">
                        <div className="meal-item-inner">
                          <span className="ml">{MEAL_NAMES[m.meal_type] ?? m.meal_type}</span>
                          {m.description}
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
