import type { Pantry } from '../types/database'

interface Props {
  pantry: Pantry[]
  onAddManual: () => void
  onAddAI: () => void
  onDelete: (id: string) => void
  canUseScanner?: boolean
}

export function PantryTab({ pantry, onAddManual, onAddAI, onDelete, canUseScanner: _canUseScanner = false }: Props) {
  const leftovers = pantry.filter(p => p.is_leftover)
  const ingredients = pantry.filter(p => !p.is_leftover)

  return (
    <div className="card">
      <div className="sec-label" style={{ marginBottom: 12 }}>
        Skafferi
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="add-btn" onClick={onAddAI}>✨ AI</button>
          <button className="add-btn" onClick={onAddManual}>+ Manuell</button>
        </div>
      </div>

      {leftovers.length > 0 && (
        <div className="pantry-section">
          <div className="pantry-section-title">
            <span>🍱 Rester</span>
            <span style={{ fontWeight: 400 }}>{leftovers.length} st</span>
          </div>
          {leftovers.map(p => (
            <PantryRow key={p.id} item={p} onDelete={onDelete} />
          ))}
        </div>
      )}

      {ingredients.length > 0 && (
        <div className="pantry-section">
          <div className="pantry-section-title">
            <span>🛒 Hemma</span>
            <span style={{ fontWeight: 400 }}>{ingredients.length} varor</span>
          </div>
          {ingredients.map(p => (
            <PantryRow key={p.id} item={p} onDelete={onDelete} />
          ))}
        </div>
      )}

      {leftovers.length === 0 && ingredients.length === 0 && (
        <div className="empty-state">Skafferiet är tomt – lägg till ingredienser eller rester.</div>
      )}
    </div>
  )
}

function PantryRow({ item, onDelete }: { item: Pantry; onDelete: (id: string) => void }) {
  return (
    <div className={`pantry-item${item.is_leftover ? ' leftover' : ''}`}>
      {item.is_leftover && <span className="leftover-badge">REST</span>}
      <span className="pantry-item-name">{item.item}</span>
      {item.expires_date && <span className="pantry-item-date">t.o.m. {item.expires_date}</span>}
      <button className="pantry-del" onClick={() => onDelete(item.id)}>✕</button>
    </div>
  )
}
