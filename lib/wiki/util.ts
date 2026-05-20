/* ═══ Wiki utilities ═══ */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

export function makeSlug(kind: string, title: string): string {
  return `${kind}--${slugify(title)}`
}

export async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function extractJSON<T = unknown>(text: string): T | null {
  const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    const raw = match[1] ?? match[0]
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + '...'
}
