import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; session: Session; user: User }

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setState({ status: 'authenticated', session, user: session.user })
      } else {
        setState({ status: 'unauthenticated' })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setState({ status: 'authenticated', session, user: session.user })
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
