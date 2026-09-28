// Polite screen-reader announcements ("Tradução copiada", "Salvo no vocabulário").
// The <Announcer> component renders the live region and registers itself here.

type Announce = (message: string) => void

let target: Announce | null = null

export function registerAnnouncer(announce: Announce): () => void {
  target = announce
  return () => {
    if (target === announce) target = null
  }
}

export function announce(message: string): void {
  target?.(message)
}
