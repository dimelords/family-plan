import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { signOut } from '../../hooks/useAuth'

interface Props {
  user: User
  inviteToken?: string   // present when user arrived via /join?token=xxx
  onDone: () => void
}

export function FamilySetupScreen({ user, inviteToken, onDone }: Props) {
  const [mode, setMode] = useState<'pick' | 'create' | 'join'>(
    inviteToken ? 'join' : 'pick'
  )
  const [familyName, setFamilyName] = useState('')
  const [memberName, setMemberName] = useState(
    user.user_metadata?.full_name?.split(' ')[0] ?? ''
  )
  const [token, setToken] = useState(inviteToken ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createFamily() {
    if (!familyName.trim() || !memberName.trim()) return
    setLoading(true); setError(null)
    try {
      // 1. Create family
      const { data: family, error: fe } = await supabase
        .from('families')
        .insert({ name: familyName.trim() })
        .select()
        .single()
      if (fe) throw fe

      // 2. Create family member linked to this user
      const { error: me } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: user.id,
          name: memberName.trim(),
          role: 'owner',
          color: '#c8f064',
        })
      if (me) throw me

      onDone()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Något gick fel')
    } finally {
      setLoading(false)
    }
  }

  async function joinFamily() {
    if (!token.trim() || !memberName.trim()) return
    setLoading(true); setError(null)
    try {
      // 1. Validate invite token
      const { data: invite, error: ie } = await supabase
        .from('family_invitations')
        .select('id, family_id')
        .eq('token', token.trim())
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()
      if (ie || !invite) throw new Error('Ogiltig eller utgången inbjudan')

      // 2. Create family member
      const { error: me } = await supabase
        .from('family_members')
        .insert({
          family_id: invite.family_id,
          user_id: user.id,
          name: memberName.trim(),
          role: 'member',
          color: '#a78bfa',
        })
      if (me) throw me

      // 3. Mark invite as used
      await supabase
        .from('family_invitations')
        .update({ used_at: new Date().toISOString(), used_by: user.id })
        .eq('id', invite.id)

      onDone()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Något gick fel')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'pick') {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">👨‍👩‍👧‍👦</div>
          <h1 className="login-title">Välkommen!</h1>
          <p className="login-sub">Vill du skapa en ny familj eller gå med i en befintlig?</p>
          <div className="login-buttons">
            <button className="btn-primary" onClick={() => setMode('create')}>
              ✨ Skapa familj
            </button>
            <button className="btn-secondary" onClick={() => setMode('join')}>
              🔗 Gå med via inbjudan
            </button>
          </div>
          <button className="login-signout" onClick={signOut}>Logga ut</button>
        </div>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">🏠</div>
          <h1 className="login-title">Skapa familj</h1>
          <div className="setup-fields">
            <label className="setup-label">Familjens namn</label>
            <input
              className="setup-input"
              placeholder="t.ex. Familjen Svensson"
              value={familyName}
              onChange={e => setFamilyName(e.target.value)}
            />
            <label className="setup-label">Ditt namn</label>
            <input
              className="setup-input"
              placeholder="t.ex. Fredrik"
              value={memberName}
              onChange={e => setMemberName(e.target.value)}
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <div className="login-buttons">
            <button
              className="btn-primary"
              onClick={createFamily}
              disabled={loading || !familyName.trim() || !memberName.trim()}
            >
              {loading ? <span className="login-spinner" /> : 'Skapa familj'}
            </button>
            <button className="btn-secondary" onClick={() => setMode('pick')}>Tillbaka</button>
          </div>
        </div>
      </div>
    )
  }

  // mode === 'join'
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">🔗</div>
        <h1 className="login-title">Gå med i familj</h1>
        <div className="setup-fields">
          <label className="setup-label">Ditt namn</label>
          <input
            className="setup-input"
            placeholder="t.ex. Mia"
            value={memberName}
            onChange={e => setMemberName(e.target.value)}
          />
          {!inviteToken && (
            <>
              <label className="setup-label">Inbjudningskod</label>
              <input
                className="setup-input"
                placeholder="Klistra in koden här"
                value={token}
                onChange={e => setToken(e.target.value)}
              />
            </>
          )}
        </div>
        {error && <p className="login-error">{error}</p>}
        <div className="login-buttons">
          <button
            className="btn-primary"
            onClick={joinFamily}
            disabled={loading || !memberName.trim() || !token.trim()}
          >
            {loading ? <span className="login-spinner" /> : 'Gå med'}
          </button>
          {!inviteToken && (
            <button className="btn-secondary" onClick={() => setMode('pick')}>Tillbaka</button>
          )}
        </div>
      </div>
    </div>
  )
}
