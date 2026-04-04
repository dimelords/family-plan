import { useCallback, useEffect, useState } from 'react'

export type ThemePref = 'dark' | 'light' | 'system'

function resolveEffective(pref: ThemePref): 'dark' | 'light' {
  if (pref !== 'system') return pref
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(pref: ThemePref) {
  document.documentElement.setAttribute('data-theme', resolveEffective(pref))
}

export function useTheme() {
  const [pref, setPrefState] = useState<ThemePref>(
    () => (localStorage.getItem('theme') as ThemePref) ?? 'system',
  )

  // Apply on mount and whenever pref changes
  useEffect(() => {
    applyTheme(pref)
  }, [pref])

  // Listen to OS-level changes when in system mode
  useEffect(() => {
    if (pref !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [pref])

  const setPref = useCallback((next: ThemePref) => {
    localStorage.setItem('theme', next)
    setPrefState(next)
  }, [])

  return { pref, setPref }
}
