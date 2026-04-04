import { weekNum } from '../lib/dates'

interface Props {
  weekStart: Date
  onPrev: () => void
  onNext: () => void
  onSettings: () => void
}

export function Header({ weekStart, onPrev, onNext, onSettings }: Props) {
  const label = `V.${weekNum(weekStart)} · ${weekStart.toLocaleString('sv-SE', { month: 'short' })}`
  return (
    <header className="header">
      <h1>Familje<span>veckan</span></h1>
      <div className="week-nav">
        <button className="nav-btn" onClick={onPrev}>‹</button>
        <span className="week-chip">{label}</span>
        <button className="nav-btn" onClick={onNext}>›</button>
      </div>
      <button className="settings-btn" onClick={onSettings} title="Inställningar">⚙️</button>
    </header>
  )
}
