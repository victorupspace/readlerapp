import type { VocabularyEntry } from '../hooks/useVocabulary'

// Anki-compatible export: one note per line, "front;back". The header lines
// tell Anki (2.1.55+) the separator and that fields contain HTML; older
// versions skip lines starting with "#".

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n/g, '<br>')
}

function csvField(value: string): string {
  return /[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function toAnkiCsv(entries: readonly VocabularyEntry[]): string {
  const lines = ['#separator:semicolon', '#html:true', '#columns:Frente;Verso']
  for (const entry of entries) {
    const front = escapeHtml(entry.term)
    let back = escapeHtml(entry.translation)
    if (entry.example) {
      back += `<br><br><i>${escapeHtml(entry.example.target)}</i><br>${escapeHtml(entry.example.pt)}`
    }
    lines.push(`${csvField(front)};${csvField(back)}`)
  }
  return `${lines.join('\n')}\n`
}

export function downloadText(filename: string, content: string, type = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
