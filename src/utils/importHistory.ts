import type { ImportHistoryEntry, LogPayload } from '../types/csv'

const IMPORT_HISTORY_KEY = 'juicios-evaluativos-import-history'

export interface LocalImportHistoryEntry extends ImportHistoryEntry {
  fingerprint: string
}

function isBrowserReady() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export async function createImportFingerprint(payload: LogPayload) {
  const stablePayload = JSON.stringify({
    fileName: payload.fileName,
    metadata: payload.metadata,
    rows: payload.rows,
    summary: payload.summary,
  })

  const encoded = new TextEncoder().encode(stablePayload)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function readImportHistory() {
  if (!isBrowserReady()) {
    return [] as LocalImportHistoryEntry[]
  }

  try {
    const rawValue = window.localStorage.getItem(IMPORT_HISTORY_KEY)
    if (!rawValue) {
      return [] as LocalImportHistoryEntry[]
    }

    const parsed = JSON.parse(rawValue) as LocalImportHistoryEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return [] as LocalImportHistoryEntry[]
  }
}

function writeImportHistory(entries: LocalImportHistoryEntry[]) {
  if (!isBrowserReady()) {
    return
  }

  window.localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify(entries))
}

export function saveImportedFile(payload: LogPayload, ficha: string, fingerprint: string) {
  const currentEntries = readImportHistory()
  const nextEntry: LocalImportHistoryEntry = {
    id: Date.now(),
    fingerprint,
    fileName: payload.fileName,
    ficha,
    rowCount: payload.rows.length,
    importedAt: new Date().toISOString(),
    metadata: payload.metadata,
    summary: payload.summary,
    previewRows: payload.rows.slice(0, 5),
  }

  writeImportHistory([nextEntry, ...currentEntries])
}

export function wasFileAlreadyImported(fingerprint: string) {
  return readImportHistory().some((entry) => entry.fingerprint === fingerprint)
}

export function removeImportHistoryByFicha(ficha: string) {
  const currentEntries = readImportHistory()
  writeImportHistory(currentEntries.filter((entry) => entry.ficha !== ficha))
}
