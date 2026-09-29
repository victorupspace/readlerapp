export function SkipLink() {
  return (
    <a
      href="#conteudo"
      onClick={(event) => {
        // Routes live in the hash, so move focus without touching it.
        event.preventDefault()
        document.getElementById('conteudo')?.focus()
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-canvas"
    >
      Pular para o conteúdo
    </a>
  )
}
