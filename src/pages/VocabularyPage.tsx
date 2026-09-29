import { BookOpen, Download, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Chip } from '../components/Chip'
import { DeleteButton, EmptyState, PageHeader, pageClass } from '../components/PageLayout'
import { SpeakButton } from '../components/SpeakButton'
import { useTranslator } from '../hooks/useTranslator'
import { removeEntry, useVocabulary, type VocabularyEntry } from '../hooks/useVocabulary'
import { downloadText, toAnkiCsv } from '../lib/csv'
import { formatRelative } from '../lib/format'
import { baseLang, bcp47, languageHue, languageName } from '../lib/languages'
import { foldForSearch } from '../lib/text'

const LANGUAGE_ORDER = ['FR', 'DE', 'EN']

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
        subtitle={entries.length ? countLabel(entries.length) : 'As palavras e expressões que você salvar ficam aqui'}
        action={
          entries.length > 0 && (
            <Button
              aria-label={exportLabel}
              title={exportLabel}
              icon={<Download size={16} strokeWidth={1.8} aria-hidden />}
              disabled={filtered.length === 0}
              onClick={() => downloadText('readler-vocabulario.csv', toAnkiCsv(filtered))}
              className="self-start sm:self-auto"
            >
              Exportar para o Anki
            </Button>
          )
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          title="Nenhuma palavra salva ainda"
          hint="Na leitura, toque numa palavra e use Salvar palavra na margem. Os exemplos também podem ser salvos."
        />
      ) : (
        <>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="flex h-10 w-full items-center gap-2.5 rounded-full border border-line bg-surface px-4 transition-colors duration-150 focus-within:border-line-strong sm:w-80">
              <Search size={16} strokeWidth={1.8} aria-hidden className="shrink-0 text-subtle" />
              <span className="sr-only">Buscar no vocabulário</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar palavra ou tradução"
                className="h-full w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-subtle focus-visible:outline-none"
              />
            </label>
            {languages.length > 1 && (
              <div className="flex flex-wrap gap-1.5 sm:ml-1">
                <Chip selected={activeLanguage === 'all'} onClick={() => setLanguage('all')}>
                  Todos
                </Chip>
                {languages.map((code) => (
                  <Chip key={code} selected={activeLanguage === code} dot={languageHue(code)} onClick={() => setLanguage(code)}>
                    {languageName(code)}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="mt-12 text-center text-[15px] text-muted">Nada encontrado para “{query.trim()}”.</p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((entry) => (
                <VocabularyCard key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

function VocabularyCard({ entry }: { entry: VocabularyEntry }) {
  const { openInReader } = useTranslator()
  return (
    <li className="flex min-h-[196px] flex-col gap-2.5 rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center gap-2 text-[13px] text-muted">
        <span aria-hidden className="size-2 rounded-full" style={{ background: languageHue(entry.termLang) }} />
        {languageName(entry.termLang)}
        <time dateTime={new Date(entry.createdAt).toISOString()} className="ml-auto text-subtle">
          {formatRelative(entry.createdAt)}
        </time>
      </div>
      <p lang={bcp47(entry.termLang)} className="text-[26px] font-semibold leading-[1.15] tracking-[-0.01em] text-ink text-pretty">
        {entry.term}
      </p>
      <p lang={bcp47(entry.translationLang)} className="text-[15px] leading-snug text-muted text-pretty">
        {entry.translation}
      </p>
      {entry.example && (
        <div className="mt-1 flex flex-col gap-0.5">
          <p lang={bcp47(entry.termLang)} className="text-[14px] leading-[1.45] text-ink text-pretty">
            {entry.example.target}
          </p>
          <p lang="pt-BR" className="text-[13px] leading-[1.45] text-muted text-pretty">
            {entry.example.pt}
          </p>
        </div>
      )}
      <div className="-mb-1.5 -ml-2 mt-auto flex items-center gap-0.5 pt-2">
        <SpeakButton variant="text" size="sm" id={`vocab-${entry.id}`} text={entry.term} lang={entry.termLang} label={`Ouvir ${entry.term}`} />
        <Button
          variant="text"
          size="sm"
          icon={<BookOpen size={14} strokeWidth={1.8} aria-hidden />}
          onClick={() => openInReader(entry.term, entry.termLang)}
        >
          Ver na leitura
        </Button>
        <span className="ml-auto">
          <DeleteButton label={`Excluir “${entry.term}”`} onConfirm={() => removeEntry(entry.id)} />
        </span>
      </div>
    </li>
  )
}
