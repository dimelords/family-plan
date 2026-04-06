import { useState } from 'react'
import { signInWithProvider } from '../../hooks/useAuth'

export function LoginScreen() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn(provider: 'apple' | 'google' | 'spotify') {
    setLoading(provider)
    setError(null)
    try {
      await signInWithProvider(provider)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Något gick fel')
      setLoading(null)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">🗓️</div>
        <h1 className="login-title">Familjeveckan</h1>
        <p className="login-sub">Planera veckan tillsammans</p>

        <div className="login-buttons">
          <button
            className="login-btn login-btn-apple"
            onClick={() => handleSignIn('apple')}
            disabled={loading !== null}
          >
            {loading === 'apple' ? (
              <span className="login-spinner" />
            ) : (
              <svg viewBox="0 0 814 1000" className="login-btn-icon" fill="currentColor">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.2-150.7-112.1C45.5 749.1 0 663.4 0 580.4c0-165.7 108.2-253.3 214.4-253.3 56.7 0 104.1 37.4 139.8 37.4 33.8 0 86.9-39.5 152.3-39.5 24.5 0 108.2 2.1 160.4 77.2zm-130.5-93.9c28.3-34.1 48.4-81.5 48.4-128.9 0-6.4-.6-12.9-1.9-18.7-45.8 1.7-100.6 30.4-133.3 70-26.4 29.8-48.9 77.2-48.9 125.3 0 7.1 1.3 14.2 1.9 16.4 2.6.5 6.5.9 10.4.9 41.4 0 93.7-28.3 123.4-64.9z"/>
              </svg>
            )}
            Fortsätt med Apple
          </button>

          <button
            className="login-btn login-btn-google"
            onClick={() => handleSignIn('google')}
            disabled={loading !== null}
          >
            {loading === 'google' ? (
              <span className="login-spinner" />
            ) : (
              <svg viewBox="0 0 24 24" className="login-btn-icon">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Fortsätt med Google
          </button>

          <button
            className="login-btn login-btn-spotify"
            onClick={() => handleSignIn('spotify')}
            disabled={loading !== null}
          >
            {loading === 'spotify' ? (
              <span className="login-spinner" />
            ) : (
              <svg viewBox="0 0 24 24" className="login-btn-icon" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            )}
            Fortsätt med Spotify
          </button>
        </div>

        {error && <p className="login-error">{error}</p>}

        <p className="login-terms">
          Genom att logga in godkänner du att din data lagras säkert och enbart delas med din familj.
        </p>
      </div>
    </div>
  )
}
