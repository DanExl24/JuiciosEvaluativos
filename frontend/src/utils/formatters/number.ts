export function formatPercent(value: number): string {
  if (Number.isNaN(value) || value === null || value === undefined) {
    return '0.0%'
  }
  return `${value.toFixed(1)}%`
}

export function prettyState(value: string | null | undefined): string {
  if (!value) return ''
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
