export function toText(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'value' in (value as Record<string, unknown>)) {
    const nested = (value as { value?: unknown }).value
    return typeof nested === 'string' ? nested : ''
  }
  return ''
}

export function toTypeLabel(value: unknown): string {
  const raw = toText(value).trim()
  if (!raw) return ''
  const withoutAngles = raw.replace(/^<|>$/g, '')
  const hashParts = withoutAngles.split('#')
  const lastByHash = hashParts[hashParts.length - 1]
  const slashParts = lastByHash.split('/')
  return slashParts[slashParts.length - 1]
}

export function sanitizeTextValue(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function hasNonEmptyText(value: string | undefined): boolean {
  return Boolean(value && value.trim() !== '')
}
