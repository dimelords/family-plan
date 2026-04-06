import { useEffect, useRef } from 'react'

/**
 * Requests a screen wake lock while `active` is true.
 * Automatically re-acquires the lock if the page becomes visible again
 * (wake lock is released by the browser when the tab is hidden).
 */
export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null)

  async function acquire() {
    if (!('wakeLock' in navigator)) return
    try {
      lockRef.current = await navigator.wakeLock.request('screen')
    } catch {
      // Silently ignore — wake lock is a nice-to-have
    }
  }

  function release() {
    lockRef.current?.release().catch(() => {})
    lockRef.current = null
  }

  useEffect(() => {
    if (!active) { release(); return }
    acquire()

    // Re-acquire after tab becomes visible again (browser releases on hide)
    function onVisibilityChange() {
      if (document.visibilityState === 'visible' && active) acquire()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      release()
    }
  }, [active])
}
