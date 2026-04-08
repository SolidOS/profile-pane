export type LinkCategory = 'project' | 'community' | 'unknown'
/* This code is AI generated from Model: GPT-5.3-Codex */
/* Prompt: can you use a keyless metadata API to
  export image, title and description and possibly whether the thing
  is a project or community.  */
export type LinkPreview = {
  url: string
  title?: string
  description?: string
  imageUrl?: string
  siteName?: string
  businessType?: string
  category: LinkCategory
}

type LinkMetaApiResponse = {
  status?: string
  message?: string
  data?: {
    url?: string
    title?: string
    description?: string
    image?: string
    siteName?: string
    type?: string
    openGraph?: {
      type?: string
      title?: string
      description?: string
      image?: string
      url?: string
      siteName?: string
    }
  }
}

type CategoryHints = {
  url?: string
  typeHint?: string
  title?: string
  description?: string
  businessType?: string
}

function tokenizeForCategory(value: string): string[] {
  return (value || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

function buildCategoryText(hints: CategoryHints) {
  const raw = [
    hints.typeHint || '',
    hints.title || '',
    hints.description || '',
    hints.businessType || '',
    hints.url || ''
  ].join(' ')

  return {
    fullText: raw.toLowerCase(),
    tokens: new Set(tokenizeForCategory(raw))
  }
}

export function classifyLinkCategory(hints: CategoryHints): LinkCategory {
  const { fullText, tokens } = buildCategoryText(hints)

  const hasCommunityToken = [
    'community', 'forum', 'group', 'club', 'team', 'association', 'society',
    'supporter', 'supporters', 'fan', 'fans', 'fandom', 'federation',
    'football', 'soccer', 'rugby', 'cricket', 'hockey', 'basketball',
    'baseball', 'volleyball', 'athletics', 'esports', 'ultras', 'fc', 'afc', 'cf', 'sc'
  ].some((token) => tokens.has(token))

  if (hasCommunityToken || fullText.includes('supporters club') || fullText.includes('football club') || fullText.includes('soccer club')) {
    return 'community'
  }

  const hasProjectToken = [
    'project', 'repo', 'repository', 'product', 'platform', 'app', 'application',
    'tool', 'library', 'framework', 'sdk', 'plugin', 'extension', 'api', 'service', 'startup'
  ].some((token) => tokens.has(token))

  if (hasProjectToken || fullText.includes('open source')) {
    return 'project'
  }

  return 'unknown'
}

function inferBusinessType(typeHint?: string, title?: string, description?: string): string | undefined {
  const typeText = (typeHint || '').trim()
  const descriptionText = (description || '').toLowerCase()
  const titleText = (title || '').toLowerCase()
  const fullText = `${titleText} ${descriptionText}`

  if (fullText.includes('soccer club')) return 'Soccer club'
  if (fullText.includes('football club')) return 'Football club'
  if (fullText.includes('sports club')) return 'Sports club'
  if (fullText.includes('nonprofit') || fullText.includes('non-profit')) return 'Nonprofit organization'

  if (!typeText) return undefined
  const loweredType = typeText.toLowerCase()
  if (loweredType === 'website' || loweredType === 'site' || loweredType === 'object') return undefined
  return typeText
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const normalizedUrl = (url || '').trim()
  if (!normalizedUrl) {
    return { url: '', category: 'unknown' }
  }

  const endpoint = `https://linkmeta.dev/api/v1/extract?url=${encodeURIComponent(normalizedUrl)}`

  const response = await fetch(endpoint)
  if (!response.ok) {
    throw new Error(`LinkMeta request failed (${response.status})`)
  }

  const payload = (await response.json()) as LinkMetaApiResponse
  if (payload?.status !== 'success' || !payload?.data) {
    throw new Error(payload?.message || 'LinkMeta API error')
  }

  const title = payload.data.openGraph?.title || payload.data.title
  const description = payload.data.openGraph?.description || payload.data.description
  const imageUrl = payload.data.openGraph?.image || payload.data.image
  const siteName = payload.data.openGraph?.siteName || payload.data.siteName
  const canonicalUrl = payload.data.openGraph?.url || payload.data.url || normalizedUrl
  const typeHint = payload.data.openGraph?.type || payload.data.type
  const businessType = inferBusinessType(typeHint, title, description)

  return {
    url: canonicalUrl,
    title,
    description,
    imageUrl,
    siteName,
    businessType,
    category: classifyLinkCategory({
      url: canonicalUrl,
      typeHint,
      title,
      description,
      businessType
    })
  }
}