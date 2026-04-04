import type { FamilyMember } from '../types/database'

interface Props {
  members: FamilyMember[]
  current: FamilyMember | null
  onSelect: (id: string) => void
}

export function PersonSwitcher({ members, current, onSelect }: Props) {
  return (
    <div className="person-switcher">
      {members.map(m => (
        <button
          key={m.id}
          className={`person-chip${current?.id === m.id ? ' active' : ''}`}
          style={{ '--person-color': m.color } as React.CSSProperties}
          onClick={() => onSelect(m.id)}
        >
          <span className="person-avatar">{m.name[0]}</span>
          <span className="person-name">{m.name}</span>
        </button>
      ))}
    </div>
  )
}
