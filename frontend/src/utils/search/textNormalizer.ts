export function normalizeSearchValue(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}
