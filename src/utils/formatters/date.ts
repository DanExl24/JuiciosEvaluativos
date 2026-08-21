export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return 'Sin fecha'
  }

  const normalizedValue = value.includes('T') ? value : `${value}-05:00`
  const parsedDate = new Date(normalizedValue)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Sin fecha válida'
  }

  return parsedDate.toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatDateTimeLong(value: string | null | undefined): string {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha válida'

  const dateStr = date.toLocaleDateString('es-CO', { dateStyle: 'medium' })
  const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${dateStr} ${timeStr}`
}
