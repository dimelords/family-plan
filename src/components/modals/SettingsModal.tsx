import { useState } from 'react'
import { getApiKey, setApiKey } from '../../lib/claude'
import { useTheme, type ThemePref } from '../../hooks/useTheme'
import type { FamilyMember, PersonPreferences } from '../../types/database'

interface Props {
  open: boolean
  member: FamilyMember | null
  prefs: PersonPreferences | null
  onSavePrefs: (p: Partial<PersonPreferences>) => Promise<void>
  onClose: () => void
}

const THEME_OPTIONS: { value: ThemePref; label: string; icon: string }[] = [
  { value: 'light',  label: 'Ljust',  icon: '☀️' },
  { value: 'dark',   label: 'Mörkt',  icon: '🌙' },
  { value: 'system', label: 'System', icon: '⚙️' },
]

export function SettingsModal({ open, member, prefs, onSavePrefs, onClose }: Props) {
  const [key, setKey] = useState(() => getApiKey() ?? '')
  const { pref, setPref } = useTheme()

  if (!open) return null

  function save() {
    setApiKey(key.trim())
    onClose()
  }

  async function toggleFeature(field: 'enable_training' | 'enable_nutrition_ai' | 'enable_body_tracking') {
    if (!prefs) return
    await onSavePrefs({ [field]: !prefs[field] })
  }

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Inställningar</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Theme */}
        <div className="form-group">
          <label className="form-label">Tema</label>
          <div className="theme-picker">
            {THEME_OPTIONS.map(opt => (
              <button key={opt.value}
                className={`theme-option${pref === opt.value ? ' active' : ''}`}
                onClick={() => setPref(opt.value)}>
                <span className="theme-icon">{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature toggles for current person */}
        {member && prefs && (
          <div className="form-group">
            <label className="form-label">Funktioner för {member.name}</label>
            <div className="feature-toggle-list">
              <FeatureToggle
                label="💪 Träning"
                enabled={prefs.enable_training}
                onToggle={() => toggleFeature('enable_training')}
              />
              <FeatureToggle
                label="🍽️ AI-matplanering"
                enabled={prefs.enable_nutrition_ai}
                onToggle={() => toggleFeature('enable_nutrition_ai')}
              />
              <FeatureToggle
                label="📊 Kroppsmätningar"
                enabled={prefs.enable_body_tracking}
                onToggle={() => toggleFeature('enable_body_tracking')}
              />
            </div>
          </div>
        )}

        {/* API key */}
        <div className="form-group">
          <label className="form-label">Anthropic API-nyckel</label>
          <input className="form-input" type="password" value={key}
            onChange={e => setKey(e.target.value)} placeholder="sk-ant-…" />
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
            Krävs för AI-funktioner. Nyckeln sparas lokalt i din webbläsare.
          </div>
        </div>

        <button className="btn-primary" onClick={save}>Spara</button>
      </div>
    </div>
  )
}

function FeatureToggle({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="feature-toggle-row" onClick={onToggle}>
      <span className="feature-toggle-label">{label}</span>
      <div className={`toggle-switch${enabled ? ' on' : ''}`}>
        <div className="toggle-thumb" />
      </div>
    </div>
  )
}
