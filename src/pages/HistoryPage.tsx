import { Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { IconButton } from '../components/IconButton'
import { DeleteButton, EmptyState, PageHeader, pageClass } from '../components/PageLayout'
import { Segmented } from '../components/Segmented'
import { removeHistoryEntry, toggleFavorite, useHistory, type HistoryEntry } from '../hooks/useHistory'
import { useTranslator } from '../hooks/useTranslator'
import { dayKey, formatDayLabel, formatTime } from '../lib/format'
import { baseLang, bcp47 } from '../lib/languages'
import { cx } from '../lib/misc'

type Filter = 'all' | 'favorites'

interface DayGroup {
  key: string
  label: string
  entries: HistoryEntry[]
}

/** Newest first, one group per calendar day: "Hoje", "Ontem", "Sexta-feira, 26 de setembro". */
function groupByDay(entries: HistoryEntry[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const entry of entries) {
    const key = dayKey(entry.createdAt)
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.entries.push(entry)
    else groups.push({ key, label: formatDayLabel(entry.createdAt), entries: [entry] })
  }
  return groups
}

export function HistoryPage() {
  const entries = useHistory()
  const { reopen } = useTranslator()
  const [filter, setFilter] = useState<Filter>('all')
  const favorites = entries.filter((entry) => entry.favorite).length
  const visible = filter === 'favorites' ? entries.filter((entry) => entry.favorite) : entries
  const groups = useMemo(() => groupByDay(visible), [visible])

  return (
    <div className={pageClass}>
      <PageHeader
        title="Histórico"
        subtitle="Suas últimas 100 traduções"
        action={
          entries.length > 0 && (
            <Segmented
              label="Mostrar"
              value={filter}
              onChange={setFilter}
              className="-mx-1.5 self-start sm:self-auto"
              options={[
                { value: 'all', label: 'Todas' },
                { value: 'favorites', label: favorites ? `Favoritas (${favorites})` : 'Favoritas' },
              ]}
            />
          )
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          title="Nenhuma tradução ainda."
          hint="Suas traduções aparecem aqui automaticamente, das mais recentes para as mais antigas."
        />
      ) : visible.length === 0 ? (
        <EmptyState title="Nenhuma favorita." hint="Toque na estrela de uma tradução para encontrá-la aqui depois." />
      ) : (
        <div className="mt-8">
          {groups.map((group) => (
            <section key={group.key} aria-label={group.label} className="pt-8 first:pt-0">
              <h2 className="label-caps border-b border-line pb-2.5 text-subtle">{group.label}</h2>
              <ul>
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
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 [&+li]:border-t [&+li]:border-line">
      <button
        type="button"
        onClick={onReopen}
        className="group -mx-3 min-w-0 rounded-md px-3 py-4 text-left transition-colors duration-150 hover:bg-ink/[0.03]"
      >
        <span className="label-caps flex items-center gap-2 text-subtle">
          <time dateTime={new Date(entry.createdAt).toISOString()}>{formatTime(entry.createdAt)}</time>
          <span aria-hidden>·</span>
          <span>
            {baseLang(source)} → {baseLang(entry.targetLang)}
          </span>
        </span>
        <span
          lang={source ? bcp47(source) : undefined}
          className="mt-1.5 line-clamp-2 text-pretty text-[16px] leading-relaxed text-ink"
        >
          {entry.sourceText}
        </span>
        <span
          lang={bcp47(entry.targetLang)}
          className="mt-0.5 line-clamp-2 text-pretty text-[15px] leading-relaxed text-muted transition-colors duration-150 group-hover:text-ink"
        >
          {entry.translation}
        </span>
      </button>
      <div className="flex shrink-0 items-center pt-3">
        <IconButton
          label="Favoritar"
          aria-pressed={entry.favorite}
          active={entry.favorite}
          onClick={() => toggleFavorite(entry.id)}
        >
          <Star size={17} strokeWidth={1.75} aria-hidden className={cx(entry.favorite && 'fill-current')} />
        </IconButton>
        <DeleteButton label="Excluir do histórico" onConfirm={() => removeHistoryEntry(entry.id)} />
      </div>
    </li>
  )
}
