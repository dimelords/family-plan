interface Props {
  onSettings: () => void
}

export function Header({ onSettings }: Props) {
  return (
    <header className="header">
      <h1>Familje<span>veckan</span></h1>
      <button className="settings-btn" onClick={onSettings} title="Inställningar">⚙️</button>
    </header>
  )
}
