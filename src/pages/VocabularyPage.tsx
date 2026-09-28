import { Download, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ActionLink } from '../components/ActionLink'
import { DeleteButton, EmptyState, PageHeader, pageClass } from '../components/PageLayout'
import { Segmented } from '../components/Segmented'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { removeEntry, useVocabulary, type VocabularyEntry } from '../hooks/useVocabulary'
import { downloadText, toAnkiCsv } from '../lib/csv'
import { formatDate } from '../lib/format'
import { baseLang, bcp47, languageName } from '../lib/languages'
import { foldForSearch, glossaryLetter } from '../lib/text'

const LANGUAGE_ORDER = ['EN', 'FR', 'DE']
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })

interface LetterGroup {
  letter: string
  entries: VocabularyEntry[]
}

function countLabel(count: number): string {
  return count === 1 ? '1 palavra ou expressão' : `${count} palavras e expressões`
}

/** Alphabetical groups, "#" (digits and symbols) last. */
function groupByLetter(entries: VocabularyEntry[]): LetterGroup[] {
  const sorted = [...entries].sort((a, b) => collator.compare(a.term, b.term))
  const groups = new Map<string, VocabularyEntry[]>()
  for (const entry of sorted) {
    const letter = glossaryLetter(entry.term)
    groups.set(letter, [...(groups.get(letter) ?? []), entry])
  }
  return [...groups]
    .sort(([a], [b]) => (a === '#' ? 1 : b === '#' ? -1 : collator.compare(a, b)))
    .map(([letter, items]) => ({ letter, entries: items }))
}

/** Splits the groups into two columns of roughly the same length, keeping the alphabet in order. */
function splitColumns(groups: LetterGroup[]): LetterGroup[][] {
  const weight = (group: LetterGroup) => group.entries.length + 1
  const total = groups.reduce((sum, group) => sum + weight(group), 0)
  const first: LetterGroup[] = []
  const second: LetterGroup[] = []
  let used = 0
  for (const group of groups) {
    ;(used < total / 2 ? first : second).push(group)
    used += weight(group)
  }
  return second.length > 0 ? [first, second] : [first]
}

export function VocabularyPage() {
  const entries = useVocabulary()
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('all')
  const wide = useMediaQuery('(min-width: 768px)')

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

  const groups = useMemo(() => groupByLetter(filtered), [filtered])
  const columns = useMemo(() => (wide ? splitColumns(groups) : [groups]), [groups, wide])

  const exportLabel = `Exportar ${countLabel(filtered.length)} como CSV para o Anki`

  return (
    <div className={pageClass}>
      <PageHeader
        title="Vocabulário"
        subtitle={entries.length ? countLabel(entries.length) : 'Palavras e expressões que você salvar'}
        action={
          entries.length > 0 && (
            <ActionLink
              aria-label={exportLabel}
              title={exportLabel}
              icon={<Download size={15} strokeWidth={1.75} aria-hidden />}
              disabled={filtered.length === 0}
              onClick={() => downloadText('readler-vocabulario.csv', toAnkiCsv(filtered))}
              className="-mx-2 self-start sm:self-auto"
            >
              Exportar CSV
            </ActionLink>
          )
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          title="Nenhuma palavra salva ainda."
          hint="Toque numa palavra da tradução, use Salvar ao pé da tradução ou salve um exemplo do verbete para guardar aqui."
        />
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex h-11 items-center gap-2.5 border-b border-line transition-colors duration-150 focus-within:border-line-focus sm:w-80">
              <Search size={16} strokeWidth={1.75} aria-hidden className="shrink-0 text-subtle" />
              <span className="sr-only">Buscar no vocabulário</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar palavra ou tradução"
                className="h-full w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-subtle focus-visible:outline-none"
              />
            </label>
            {languages.length > 1 && (
              <Segmented
                label="Filtrar por idioma"
                value={activeLanguage}
                onChange={setLanguage}
                className="-mx-1.5 self-start sm:self-auto"
                options={[
                  { value: 'all', label: 'Todos' },
                  ...languages.map((code) => ({ value: code, label: languageName(code) })),
                ]}
              />
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="mt-12 text-center text-[15px] text-muted">
              Nada encontrado para “{query.trim()}”.
            </p>
          ) : (
            <div className="mt-8 grid gap-x-14 md:grid-cols-2">
              {columns.map((column, index) => (
                <div key={index}>
                  {column.map((group) => (
                    <section key={group.letter} aria-label={`Letra ${group.letter}`} className="pt-8 first:pt-0">
                      <h2 className="border-b border-line pb-2 font-display text-[1.75rem] font-semibold leading-none text-accent">
                        {group.letter}
                      </h2>
                      <ul>
                        {group.entries.map((entry) => (
                          <GlossaryEntry key={entry.id} entry={entry} />
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function GlossaryEntry({ entry }: { entry: VocabularyEntry }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 py-4 [&+li]:border-t [&+li]:border-line">
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span lang={bcp47(entry.termLang)} className="font-display text-[1.1875rem] font-semibold leading-snug text-ink">
            {entry.term}
          </span>
          <span className="label-caps text-subtle">{languageName(entry.termLang)}</span>
        </p>
        <p lang={bcp47(entry.translationLang)} className="mt-0.5 text-[15px] leading-relaxed text-muted">
          {entry.translation}
        </p>
        {entry.example && (
          <div className="mt-2.5 border-l border-line pl-3">
            <p lang={bcp47(entry.termLang)} className="font-display text-[1.0625rem] font-medium leading-relaxed text-ink">
              {entry.example.target}
            </p>
            <p lang="pt-BR" className="text-[14px] leading-relaxed text-muted">
              {entry.example.pt}
            </p>
          </div>
        )}
      </div>
      <div className="-mr-2 -mt-1.5 flex flex-col items-end">
        <DeleteButton label={`Excluir “${entry.term}”`} onConfirm={() => removeEntry(entry.id)} />
        <time dateTime={new Date(entry.createdAt).toISOString()} className="pr-2 text-[12px] tabular-nums text-subtle">
          {formatDate(entry.createdAt)}
        </time>
      </div>
    </li>
  )
}
