import { useEffect, useState } from 'react'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; session: Session; user: User }

// Dev bypass: set VITE_DEV_EMAIL + VITE_DEV_PASSWORD in .env.local to skip OAuth.
// Uses a real Supabase email/password account so RLS still works normally.
// These vars are never present in production builds (Netlify doesn't set them).
const DEV_EMAIL    = import.meta.env.VITE_DEV_EMAIL as string | undefined
const DEV_PASSWORD = import.meta.env.VITE_DEV_PASSWORD as string | undefined

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    const setAuthenticated = (session: Session) =>
      setState({ status: 'authenticated', session, user: session.user })

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setAuthenticated(session)
      } else if (DEV_EMAIL && DEV_PASSWORD) {
        // Auto sign-in: resolve directly from return value to avoid the
        // INITIAL_SESSION(null) → onAuthStateChange race that shows the login screen.
        const { data, error } = await supabase.auth.signInWithPassword({
          email: DEV_EMAIL,
          password: DEV_PASSWORD,
        })

        if (data.session) {
          setAuthenticated(data.session)
        } else {
          console.error('[DEV] Auto sign-in failed:', error?.message)
          setState({ status: 'unauthenticated' })
        }
      } else {
        setState({ status: 'unauthenticated' })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
      // During dev auto-login the INITIAL_SESSION fires with null before signInWithPassword
      // resolves — ignore those nulls so we don't flash the login screen.
      if (!session && DEV_EMAIL && DEV_PASSWORD && event === 'INITIAL_SESSION') return
      if (session) {
        setAuthenticated(session)
      } else {
        setState({ status: 'unauthenticated' })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}

export async function signInWithProvider(provider: 'google' | 'github' | 'spotify') {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin + window.location.pathname + window.location.search,
    },
  })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
}
