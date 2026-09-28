import { Star } from 'lucide-react'
import { useState } from 'react'
import { IconButton } from '../components/IconButton'
import { DeleteButton, EmptyState, listClass, PageHeader, pageClass } from '../components/PageLayout'
import { Segmented } from '../components/Segmented'
import { removeHistoryEntry, toggleFavorite, useHistory, type HistoryEntry } from '../hooks/useHistory'
import { useTranslator } from '../hooks/useTranslator'
import { formatRelative } from '../lib/format'
import { baseLang, bcp47 } from '../lib/languages'
import { cx } from '../lib/misc'

type Filter = 'all' | 'favorites'

export function HistoryPage() {
  const entries = useHistory()
  const { reopen } = useTranslator()
  const [filter, setFilter] = useState<Filter>('all')
  const favorites = entries.filter((entry) => entry.favorite).length
  const visible = filter === 'favorites' ? entries.filter((entry) => entry.favorite) : entries

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
              className="self-start sm:self-auto"
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
        <EmptyState
          title="Nenhuma favorita."
          hint="Toque na estrela de uma tradução para encontrá-la aqui depois."
        />
      ) : (
        <ul className={listClass}>
          {visible.map((entry) => (
            <HistoryRow key={entry.id} entry={entry} onReopen={() => reopen(entry)} />
          ))}
        </ul>
      )}
    </div>
  )
}

function HistoryRow({ entry, onReopen }: { entry: HistoryEntry; onReopen: () => void }) {
  const source = entry.sourceLang === 'auto' ? (entry.detectedLang ?? '') : entry.sourceLang
  return (
    <li className="flex items-start gap-1 px-2 py-2 sm:px-3">
      <button
        type="button"
        onClick={onReopen}
        className="min-w-0 flex-1 rounded-2xl px-3 py-3 text-left transition-colors duration-150 hover:bg-ink/[0.03] sm:px-4"
      >
        <span className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.1em] text-subtle">
          <span>
            {baseLang(source)} → {baseLang(entry.targetLang)}
          </span>
          <span aria-hidden>·</span>
          <time dateTime={new Date(entry.createdAt).toISOString()} className="normal-case tracking-normal">
            {formatRelative(entry.createdAt)}
          </time>
        </span>
        <span lang={source ? bcp47(source) : undefined} className="mt-1.5 line-clamp-2 text-[16px] leading-relaxed text-ink">
          {entry.sourceText}
        </span>
        <span lang={bcp47(entry.targetLang)} className="mt-0.5 line-clamp-2 text-[15px] leading-relaxed text-muted">
          {entry.translation}
        </span>
      </button>
      <div className="flex shrink-0 items-center pt-2">
        <IconButton
          label="Favoritar"
          aria-pressed={entry.favorite}
          active={entry.favorite}
          onClick={() => toggleFavorite(entry.id)}
        >
          <Star size={18} strokeWidth={1.75} aria-hidden className={cx(entry.favorite && 'fill-current')} />
        </IconButton>
        <DeleteButton label="Excluir do histórico" onConfirm={() => removeHistoryEntry(entry.id)} />
      </div>
    </li>
  )
}
