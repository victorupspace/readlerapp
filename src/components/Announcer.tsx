import { useEffect, useState } from 'react'
import { registerAnnouncer } from '../lib/announce'

/** Visually hidden live region for short confirmations. */
export function Announcer() {
  const [message, setMessage] = useState('')

  useEffect(
    () =>
      registerAnnouncer((next) => {
        // Clear first so repeating the same message is announced again.
        setMessage('')
        requestAnimationFrame(() => setMessage(next))
      }),
    [],
  )

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  )
}
