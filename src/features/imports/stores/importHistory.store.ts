import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ImportHistoryEntry, LogPayload } from '../../../types/csv'

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

export const useImportHistoryStore = defineStore('importHistory', () => {
  const entries = ref<LocalImportHistoryEntry[]>([])

  function loadHistory() {
    if (!isBrowserReady()) return []
    try {
      const raw = window.localStorage.getItem(IMPORT_HISTORY_KEY)
      if (!raw) {
        entries.value = []
        return []
      }
      const parsed = JSON.parse(raw) as LocalImportHistoryEntry[]
      entries.value = Array.isArray(parsed) ? parsed : []
      return entries.value
    } catch {
      entries.value = []
      return []
    }
  }

  function saveEntry(payload: LogPayload, ficha: string, fingerprint: string) {
    loadHistory()
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

    entries.value = [nextEntry, ...entries.value]
    if (isBrowserReady()) {
      window.localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify(entries.value))
    }
  }

  function wasAlreadyImported(fingerprint: string) {
    loadHistory()
    return entries.value.some((entry) => entry.fingerprint === fingerprint)
  }

  function removeByFicha(ficha: string) {
    loadHistory()
    entries.value = entries.value.filter((entry) => entry.ficha !== ficha)
    if (isBrowserReady()) {
      window.localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify(entries.value))
    }
  }

  function clearAll() {
    entries.value = []
    if (isBrowserReady()) {
      window.localStorage.removeItem(IMPORT_HISTORY_KEY)
    }
  }

  return {
    entries,
    loadHistory,
    saveEntry,
    wasAlreadyImported,
    removeByFicha,
    clearAll,
  }
})
