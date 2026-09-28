import { Bookmark, Check, Copy } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslator } from '../../hooks/useTranslator'
import { findEntry, toggleEntry, useVocabulary } from '../../hooks/useVocabulary'
import { announce } from '../../lib/announce'
import type { ExplainRequest } from '../../lib/api'
import { bcp47, isPortuguese, supportsFormality, TARGET_LANGUAGES, toTargetLang } from '../../lib/languages'
import { cx } from '../../lib/misc'
import { resolvedSource, studyDraft } from '../../lib/study'
import { ActionLink } from '../ActionLink'
import { FormalityToggle } from '../FormalityToggle'
import { InlineError } from '../InlineError'
import { LanguageSelect } from '../LanguageSelect'
import { SpeakButton } from '../SpeakButton'
import { PageFoot, pageBodyClass, pageTextClass, RunningHead } from './Panel'
import { ProgressLine } from './ProgressLine'
import { SwapButton } from './SwapButton'
import { TappableText } from './TappableText'
import { WordPopover } from './WordPopover'

interface OpenWord {
  resultKey: string
  index: number
  word: string
  anchor: HTMLElement
}

export function TargetPanel() {
  const translator = useTranslator()
  const { loading, error, targetLang } = translator
  // While an error is shown, actions must not act on the previous translation.
  const result = error ? null : translator.result
  const vocabulary = useVocabulary()
  const [copied, setCopied] = useState(false)
  const [openWord, setOpenWord] = useState<OpenWord | null>(null)

  const source = result ? resolvedSource(result) : null
  const draft = result && source ? studyDraft(result.text, source, result.translation, result.targetLang) : null
  const saved = draft ? Boolean(findEntry(vocabulary, draft.term, draft.termLang)) : false

  // Tapped words go into Portuguese; if the translation already is Portuguese,
  // into the source language instead.
  const lookupLang = result && source ? (isPortuguese(result.targetLang) ? toTargetLang(source) : 'PT-BR') : null
  const canLookUp = lookupLang !== null && !(result && isPortuguese(result.targetLang) && isPortuguese(lookupLang))
  const shownWord = openWord && result && openWord.resultKey === result.key ? openWord : null

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.translation)
      setCopied(true)
      announce('Tradução copiada')
    } catch {
      announce('Não foi possível copiar')
    }
  }

  const toggleSave = () => {
    if (!draft) return
    announce(toggleEntry(draft) ? 'Salvo no vocabulário' : 'Removido do vocabulário')
  }

  const openWordRef = useRef(openWord)
  useEffect(() => {
    openWordRef.current = openWord
  }, [openWord])

  const closeWord = useCallback((restoreFocus: boolean) => {
    if (restoreFocus) openWordRef.current?.anchor.focus()
    setOpenWord(null)
  }, [])

  const explainWord = (request: ExplainRequest) => {
    setOpenWord(null)
    translator.focusWord(request)
  }

  return (
    <div className="relative flex min-w-0 flex-col border-t border-line bg-tint md:border-l md:border-t-0">
      <ProgressLine active={loading} />
      <SwapButton
        onSwap={translator.swap}
        disabled={!translator.canSwap}
        className="left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 md:left-0 md:top-6"
      />

      <RunningHead className="md:pl-10">
        <LanguageSelect
          id="target-lang"
          label="Idioma de destino"
          value={targetLang}
          options={TARGET_LANGUAGES}
          onChange={translator.setTargetLang}
          className="min-w-0"
        />
        {supportsFormality(targetLang) && (
          <FormalityToggle
            className="-mr-1.5 ml-auto"
            value={translator.formality}
            onChange={translator.setFormality}
            targetLang={targetLang}
          />
        )}
      </RunningHead>

      <div
        className={cx(
          pageBodyClass,
          pageTextClass,
          'transition-opacity duration-200',
          loading && result && 'opacity-50',
        )}
      >
        {error ? (
          <InlineError message={error} onRetry={translator.translateNow} />
        ) : result ? (
          canLookUp ? (
            <TappableText
              key={result.key}
              text={result.translation}
              lang={bcp47(result.targetLang)}
              selectedIndex={shownWord?.index ?? null}
              onWord={(word, index, anchor) => setOpenWord({ resultKey: result.key, index, word, anchor })}
              className="animate-fade text-pretty"
            />
          ) : (
            <p
              key={result.key}
              lang={bcp47(result.targetLang)}
              className="animate-fade whitespace-pre-wrap text-pretty break-words"
            >
              {result.translation}
            </p>
          )
        ) : (
          <p aria-hidden className="text-subtle">
            Tradução
          </p>
        )}
      </div>

      <PageFoot>
        <SpeakButton
          variant="text"
          id="target"
          text={result?.translation ?? ''}
          lang={result?.targetLang ?? targetLang}
          label="Ouvir tradução"
        />
        <SpeakButton
          variant="text"
          id="target-slow"
          text={result?.translation ?? ''}
          lang={result?.targetLang ?? targetLang}
          label="Ouvir devagar"
          slow
        />
        <div className="ml-auto flex items-center gap-1">
          <ActionLink
            aria-label={copied ? 'Copiado' : 'Copiar tradução'}
            title={copied ? 'Copiado' : 'Copiar tradução'}
            icon={copied ? <Check size={14} strokeWidth={2} aria-hidden /> : <Copy size={14} strokeWidth={1.75} aria-hidden />}
            disabled={!result}
            active={copied}
            onClick={copy}
          >
            {copied ? 'Copiado' : 'Copiar'}
          </ActionLink>
          <ActionLink
            aria-label={saved ? 'Remover do vocabulário' : 'Salvar no vocabulário'}
            title={saved ? 'Remover do vocabulário' : 'Salvar no vocabulário'}
            icon={<Bookmark size={14} strokeWidth={1.75} aria-hidden className={cx(saved && 'fill-current')} />}
            disabled={!draft}
            active={saved}
            onClick={toggleSave}
          >
            {saved ? 'Salvo' : 'Salvar'}
          </ActionLink>
        </div>
      </PageFoot>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {result ? `Tradução: ${result.translation}` : ''}
      </p>

      {shownWord && lookupLang && result && (
        <WordPopover
          key={`${shownWord.resultKey}:${shownWord.index}`}
          word={shownWord.word}
          wordLang={result.targetLang}
          lookupLang={lookupLang}
          anchor={shownWord.anchor}
          onClose={closeWord}
          onExplain={explainWord}
        />
      )}
    </div>
  )
}
