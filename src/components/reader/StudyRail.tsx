import { useStudySubject } from '../../hooks/useStudySubject'
import { StudyPanel } from './StudyPanel'

/** The study margin on wide screens: a column that stays in view while you read. */
export function StudyRail() {
  const subject = useStudySubject()
  return (
    <aside
      aria-label="Margem de estudo"
      className="sticky top-[88px] max-h-[calc(100dvh-112px)] self-start overflow-y-auto rounded-[20px] border border-line bg-surface p-7 shadow-rail"
    >
      <StudyPanel subject={subject} size="rail" />
    </aside>
  )
}
