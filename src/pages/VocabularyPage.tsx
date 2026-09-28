import { Download, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DeleteButton, EmptyState, listClass, PageHeader, pageClass } from '../components/PageLayout'
import { Segmented } from '../components/Segmented'
import { removeEntry, useVocabulary, type VocabularyEntry } from '../hooks/useVocabulary'
import { downloadText, toAnkiCsv } from '../lib/csv'
import { formatDate } from '../lib/format'
import { baseLang, bcp47, languageName } from '../lib/languages'
import { foldForSearch } from '../lib/text'

const LANGUAGE_ORDER = ['EN', 'FR', 'DE']

function countLabel(count: number): string {
  return count === 1 ? '1 palavra ou expressão' : `${count} palavras e expressões`
}

export function VocabularyPage() {
  const entries = useVocabulary()
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('all')

  const languages = useMemo(() => {
    const present = [...new Set(entries.map((entry) => baseLang(entry.termLang)))]
    const rank = (code: string) => (LANGUAGE_ORDER.includes(code) ? LANGUAGE_ORDER.indexOf(code) : LANGUAGE_ORDER.length)
    return present.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
  }, [entries])

  const activeLanguage = language !== 'all' && languages.includes(language) ? language : 'all'

  const filtered = useMemo(() => {
    const needle = foldForSearch(query.trim())
    return entries.filter((entry) => {
      if (activeLanguage !== 'all' && baseLang(entry.termLang) !== activeLanguage) return false
      if (!needle) return true
      const haystack = [entry.term, entry.translation, entry.example?.target ?? '', entry.example?.pt ?? ''].join(' ')
      return foldForSearch(haystack).includes(needle)
    })
  }, [entries, query, activeLanguage])

  const exportLabel = `Exportar ${countLabel(filtered.length)} como CSV para o Anki`

  return (
    <div className={pageClass}>
      <PageHeader
        title="Vocabulário"
        subtitle={entries.length ? countLabel(entries.length) : 'Palavras e expressões que você salvar'}
        action={
          entries.length > 0 && (
            <button
              type="button"
              aria-label={exportLabel}
              title={exportLabel}
              disabled={filtered.length === 0}
              onClick={() => downloadText('readler-vocabulario.csv', toAnkiCsv(filtered))}
              className="inline-flex h-11 items-center gap-2 self-start rounded-full border border-line bg-surface px-4 text-[14px] font-medium text-ink transition-colors duration-150 hover:border-line-strong disabled:opacity-40 sm:self-auto"
            >
              <Download size={17} strokeWidth={1.75} aria-hidden />
              Exportar CSV
            </button>
          )
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          title="Nenhuma palavra salva ainda."
          hint="Toque numa palavra da tradução, use o marcador ao lado da tradução ou salve um exemplo para guardar aqui."
        />
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex h-11 items-center rounded-full border border-line bg-surface px-4 transition-colors duration-150 focus-within:border-line-strong focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent sm:w-80">
              <Search size={17} strokeWidth={1.75} aria-hidden className="shrink-0 text-subtle" />
              <span className="sr-only">Buscar no vocabulário</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar palavra ou tradução"
                className="ml-2.5 h-full w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-subtle focus-visible:outline-none"
              />
            </label>
            {languages.length > 1 && (
              <Segmented
                label="Filtrar por idioma"
                value={activeLanguage}
                onChange={setLanguage}
                className="self-start sm:self-auto"
                options={[
                  { value: 'all', label: 'Todos' },
                  ...languages.map((code) => ({ value: code, label: languageName(code) })),
                ]}
              />
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="mt-10 text-center text-[15px] text-muted">Nada encontrado para “{query.trim()}”.</p>
          ) : (
            <ul className={listClass}>
              {filtered.map((entry) => (
                <VocabularyRow key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

function VocabularyRow({ entry }: { entry: VocabularyEntry }) {
  return (
    <li className="flex gap-4 px-5 py-5 sm:px-7 sm:py-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p lang={bcp47(entry.termLang)} className="font-serif text-[1.3125rem] leading-snug text-ink">
            {entry.term}
          </p>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
            {languageName(entry.termLang)}
          </span>
        </div>
        <p lang={bcp47(entry.translationLang)} className="mt-0.5 text-[15px] leading-relaxed text-muted">
          {entry.translation}
        </p>
        {entry.example && (
          <div className="mt-3 border-l-2 border-line pl-3">
            <p lang={bcp47(entry.termLang)} className="font-serif text-[1.0625rem] italic leading-relaxed text-ink">
              {entry.example.target}
            </p>
            <p lang="pt-BR" className="text-[14px] leading-relaxed text-muted">
              {entry.example.pt}
            </p>
          </div>
        )}
      </div>
      <div className="-mr-2 -mt-2 flex shrink-0 flex-col items-end gap-1 sm:-mr-3">
        <DeleteButton label={`Excluir “${entry.term}”`} onConfirm={() => removeEntry(entry.id)} />
        <time dateTime={new Date(entry.createdAt).toISOString()} className="pr-2 text-[13px] text-subtle sm:pr-3">
          {formatDate(entry.createdAt)}
        </time>
      </div>
    </li>
  )
}
