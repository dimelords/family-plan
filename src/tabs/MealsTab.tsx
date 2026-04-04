import { GYM_DAYS, FULL_DAY_NAMES, MEAL_NAMES } from '../lib/constants'
import { dateStr } from '../lib/dates'
import type { MealPlan } from '../types/database'

interface Props {
  days: Date[]
  meals: MealPlan[]
  onAdd: () => void
  onDelete: (id: string) => void
}

export function MealsTab({ days, meals, onAdd, onDelete }: Props) {
  return (
    <div className="card">
      <div className="sec-label" style={{ marginBottom: 12 }}>
        Måltidsplan
        <button className="add-btn" onClick={onAdd}>+ Lägg till</button>
      </div>
      {days.map((d, i) => {
        const ds = dateStr(d)
        const isGym = (GYM_DAYS as readonly number[]).includes(i)
        const dayMeals = meals.filter(m => m.day === ds)
        return (
          <div key={ds} className="meal-day-block">
            <div className={`meal-day-header${isGym ? ' gym-day' : ''}`}>
              {FULL_DAY_NAMES[i]}
              {isGym && <span className="gym-badge">GYM</span>}
            </div>
            <div className="meal-items">
              {dayMeals.length === 0
                ? <div className="empty-state" style={{ padding: '4px 0' }}>Inga måltider planerade</div>
                : dayMeals.map(m => (
                    <div key={m.id} className="meal-item">
                      <div className="meal-item-inner">
                        <span className="ml">{MEAL_NAMES[m.meal_type] ?? m.meal_type}</span>
                        {m.description}
                      </div>
                      <button className="meal-del" onClick={() => onDelete(m.id)}>✕</button>
                    </div>
                  ))
              }
            </div>
          </div>
        )
      })}
    </div>
  )
}
