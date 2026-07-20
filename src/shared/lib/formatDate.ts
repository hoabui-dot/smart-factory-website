import dayjs from 'dayjs'

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-'
  const d = dayjs(value)
  if (!d.isValid()) return value
  return d.format('DD/MM/YYYY')
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  const d = dayjs(value)
  if (!d.isValid()) return value
  return d.format('DD/MM/YYYY HH:mm:ss')
}
