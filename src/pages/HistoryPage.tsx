import { ArrowRight, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Chip } from '../components/Chip'
import { IconButton } from '../components/IconButton'
import { DeleteButton, EmptyState, PageHeader, pageClass } from '../components/PageLayout'
import { removeHistoryEntry, toggleFavorite, useHistory, type HistoryEntry } from '../hooks/useHistory'
import { useTranslator } from '../hooks/useTranslator'
import { dayKey, formatDayLabel, formatNumber, formatTime } from '../lib/format'
import { bcp47, isStudyLang, languageHue, languageName } from '../lib/languages'
import { cx } from '../lib/misc'

type Filter = 'all' | 'favorites'

interface DayGroup {
  key: string
  label: string
  entries: HistoryEntry[]
  characters: number
}

/** Newest first, one group per calendar day: "Hoje", "Ontem", "Sexta-feira, 26 de setembro". */
function groupByDay(entries: HistoryEntry[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const entry of entries) {
    const key = dayKey(entry.createdAt)
    const last = groups[groups.length - 1]
    if (last && last.key === key) {
      last.entries.push(entry)
      last.characters += entry.sourceText.length
    } else {
      groups.push({ key, label: formatDayLabel(entry.createdAt), entries: [entry], characters: entry.sourceText.length })
    }
  }
  return groups
}

function readingsLabel(count: number): string {
  return count === 1 ? '1 leitura' : `${count} leituras`
}

export function HistoryPage() {
  const entries = useHistory()
  const { reopen } = useTranslator()
  const [filter, setFilter] = useState<Filter>('all')
  const favorites = entries.filter((entry) => entry.favorite).length
  const visible = filter === 'favorites' ? entries.filter((entry) => entry.favorite) : entries
  const groups = useMemo(() => groupByDay(visible), [visible])

  return (
    <div className={cx(pageClass, 'max-w-[1120px]')}>
      <PageHeader
        title="Histórico"
        subtitle="Suas últimas 100 leituras. Toque numa para reabrir."
        action={
          entries.length > 0 && (
            <div className="flex gap-1.5 self-start sm:self-auto">
              <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>
                Todas
              </Chip>
              <Chip selected={filter === 'favorites'} onClick={() => setFilter('favorites')}>
                {favorites ? `Favoritas (${favorites})` : 'Favoritas'}
              </Chip>
            </div>
          )
        }
      />

      {entries.length === 0 ? (
        <EmptyState title="Nenhuma leitura ainda" hint="Tudo o que você traduzir aparece aqui, do mais recente ao mais antigo." />
      ) : visible.length === 0 ? (
        <EmptyState title="Nenhuma favorita" hint="Toque na estrela de uma leitura para encontrá-la aqui depois." />
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.key} aria-label={group.label} className="flex flex-col gap-2.5">
              <div className="flex items-baseline gap-3 px-1">
                <h2 className="text-[15px] font-semibold text-ink">{group.label}</h2>
                <span className="text-[13px] text-subtle">
                  {readingsLabel(group.entries.length)}, {formatNumber(group.characters)} caracteres
                </span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {group.entries.map((entry) => (
                  <HistoryRow key={entry.id} entry={entry} onReopen={() => reopen(entry)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryRow({ entry, onReopen }: { entry: HistoryEntry; onReopen: () => void }) {
  const source = entry.sourceLang === 'auto' ? (entry.detectedLang ?? '') : entry.sourceLang
  const pair = (
    <span className="flex items-center gap-1.5 text-[13px] text-muted">
      <LanguageTag code={source} />
      <ArrowRight size={12} strokeWidth={2.4} aria-hidden className="text-subtle" />
      <LanguageTag code={entry.targetLang} />
    </span>
  )
  return (
    <li className="flex items-start gap-2 rounded-2xl border border-line bg-surface pr-2 transition-colors duration-150 hover:border-line-strong">
      <button
        type="button"
        onClick={onReopen}
        className="grid min-w-0 flex-1 gap-x-5 gap-y-1.5 rounded-2xl px-5 py-4 text-left sm:grid-cols-[56px_150px_minmax(0,1fr)] sm:gap-y-0"
      >
        <span className="flex items-center gap-3 sm:contents">
          <time dateTime={new Date(entry.createdAt).toISOString()} className="text-[13px] tabular-nums text-subtle sm:pt-[3px]">
            {formatTime(entry.createdAt)}
          </time>
          <span className="sm:pt-[3px]">{pair}</span>
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span lang={source ? bcp47(source) : undefined} className="line-clamp-2 text-[16px] leading-[1.45] text-ink text-pretty">
            {entry.sourceText}
          </span>
          <span lang={bcp47(entry.targetLang)} className="line-clamp-2 text-[15px] leading-[1.45] text-muted text-pretty">
            {entry.translation}
          </span>
        </span>
      </button>
      <div className="flex shrink-0 items-center pt-2.5">
        <IconButton label="Favoritar" aria-pressed={entry.favorite} active={entry.favorite} onClick={() => toggleFavorite(entry.id)}>
          <Star size={17} strokeWidth={1.8} aria-hidden className={cx(entry.favorite && 'fill-current')} />
        </IconButton>
        <DeleteButton label="Excluir do histórico" onConfirm={() => removeHistoryEntry(entry.id)} />
      </div>
    </li>
  )
}

function LanguageTag({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {code && isStudyLang(code) && <span aria-hidden className="size-2 rounded-full" style={{ background: languageHue(code) }} />}
      {code ? languageName(code) : '…'}
    </span>
  )
}
