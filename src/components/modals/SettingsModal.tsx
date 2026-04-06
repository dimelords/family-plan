import { useState } from 'react'
import { getApiKey, setApiKey } from '../../lib/claude'
import { useTheme, type ThemePref } from '../../hooks/useTheme'
import { signOut } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
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
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const isOwner = member?.role === 'owner'

  function save() {
    setApiKey(key.trim())
    onClose()
  }

  async function toggleFeature(field: 'enable_training' | 'enable_nutrition_ai' | 'enable_body_tracking') {
    if (!prefs) return
    await onSavePrefs({ [field]: !prefs[field] })
  }

  async function generateInvite() {
    if (!member?.family_id) return
    setInviteLoading(true)
    try {
      const { data, error } = await supabase
        .from('family_invitations')
        .insert({ family_id: member.family_id })
        .select('token')
        .single()
      if (error) throw error
      const url = `${window.location.origin}/?join=${data.token}`
      setInviteLink(url)
    } catch (e) {
      console.error(e)
    } finally {
      setInviteLoading(false)
    }
  }

  async function shareOrCopy() {
    if (!inviteLink) return
    if (navigator.share) {
      await navigator.share({ title: 'Gå med i Familjeveckan', url: inviteLink })
    } else {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
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

        {/* Feature toggles + timing */}
        {member && prefs && (
          <>
            <div className="form-group">
              <label className="form-label">Funktioner för {member.name}</label>
              <div className="feature-toggle-list">
                <FeatureToggle label="💪 Träning" enabled={prefs.enable_training}
                  onToggle={() => toggleFeature('enable_training')} />
                <FeatureToggle label="🍽️ AI-matplanering" enabled={prefs.enable_nutrition_ai}
                  onToggle={() => toggleFeature('enable_nutrition_ai')} />
                <FeatureToggle label="📊 Kroppsmätningar" enabled={prefs.enable_body_tracking}
                  onToggle={() => toggleFeature('enable_body_tracking')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Dagliga tider</label>
              <div className="settings-time-row">
                <div className="settings-time-field">
                  <span className="settings-time-label">🌅 Vaknar</span>
                  <input className="form-input" type="time"
                    defaultValue={prefs.wake_time ?? '07:00'}
                    onBlur={e => onSavePrefs({ wake_time: e.target.value })} />
                </div>
                <div className="settings-time-field">
                  <span className="settings-time-label">💪 Träning</span>
                  <input className="form-input" type="time"
                    defaultValue={prefs.preferred_training_time ?? '11:00'}
                    onBlur={e => onSavePrefs({ preferred_training_time: e.target.value })} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                Används av AI för att anpassa måltidstiming till din dag.
              </div>
            </div>
          </>
        )}

        {/* Invite — only for owners */}
        {isOwner && (
          <div className="form-group">
            <label className="form-label">Bjud in familjemedlem</label>
            {!inviteLink ? (
              <button className="btn-secondary" onClick={generateInvite} disabled={inviteLoading}>
                {inviteLoading ? '…' : '🔗 Skapa inbjudningslänk'}
              </button>
            ) : (
              <div className="invite-link-box">
                <span className="invite-link-text">{inviteLink}</span>
                <button className="btn-secondary invite-share-btn" onClick={shareOrCopy}>
                  {copied ? '✓ Kopierad!' : ('share' in navigator ? '↗ Dela' : '📋 Kopiera')}
                </button>
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              Länken är giltig i 48 timmar och kan bara användas en gång.
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

        {/* Sign out */}
        <button className="btn-signout" onClick={signOut}>Logga ut</button>
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
