export type LinkCategory = 'project' | 'community' | 'unknown'
/* This code is AI generated from Model: GPT-5.3-Codex */
/* Prompt: can you  use this https://www.opengraph.io/link-preview-api to
  export a image, title and description and possibly whether the thing
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

type OpenGraphApiResponse = {
  hybridGraph?: {
    title?: string
    description?: string
    image?: string
    url?: string
    site_name?: string
    type?: string
    images?: string[]
  }
  openGraph?: {
    title?: string
    description?: string
    image?: { url?: string } | string
    url?: string
    site_name?: string
    type?: string
    images?: string[]
  }
  htmlInferred?: {
    title?: string
    description?: string
    image?: string
    images?: string[]
    url?: string
    site_name?: string
    type?: string
  }
}

function inferCategory(typeHint?: string, title?: string, description?: string): LinkCategory {
  const typeText = (typeHint || '').toLowerCase()
  const titleText = (title || '').toLowerCase()
  const descriptionText = (description || '').toLowerCase()
  const fullText = `${typeText} ${titleText} ${descriptionText}`

  if (fullText.includes('community') || fullText.includes('forum') || fullText.includes('group')) {
    return 'community'
  }

  if (fullText.includes('project') || fullText.includes('repo') || fullText.includes('product')) {
    return 'project'
  }

  if (fullText.includes('club') || fullText.includes('team') || fullText.includes('association') || fullText.includes('society')) {
    return 'community'
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

function pickImage(response: OpenGraphApiResponse): string | undefined {
  const ogImage = response.openGraph?.image
  if (typeof ogImage === 'string') return ogImage
  if (ogImage && typeof ogImage === 'object' && ogImage.url) return ogImage.url

  if (response.hybridGraph?.image) return response.hybridGraph.image
  if (response.htmlInferred?.image) return response.htmlInferred.image

  const inferredImages = response.htmlInferred?.images || []
  if (Array.isArray(inferredImages) && inferredImages.length > 0) return inferredImages[0]

  const hybridImages = response.hybridGraph?.images || []
  if (Array.isArray(hybridImages) && hybridImages.length > 0) return hybridImages[0]

  const ogImages = response.openGraph?.images || []
  if (Array.isArray(ogImages) && ogImages.length > 0) return ogImages[0]

  return undefined
}

export async function fetchLinkPreview(url: string, apiKey: string): Promise<LinkPreview> {
  const normalizedUrl = (url || '').trim()
  if (!normalizedUrl) {
    return { url: '', category: 'unknown' }
  }

  const endpoint = `https://opengraph.io/api/1.1/site/${encodeURIComponent(normalizedUrl)}?app_id=${encodeURIComponent(apiKey)}`

  const response = await fetch(endpoint)
  if (!response.ok) {
    throw new Error(`OpenGraph request failed (${response.status})`)
  }

  const payload = (await response.json()) as OpenGraphApiResponse

  const title = payload.hybridGraph?.title || payload.openGraph?.title || payload.htmlInferred?.title
  const description = payload.hybridGraph?.description || payload.openGraph?.description || payload.htmlInferred?.description
  const imageUrl = pickImage(payload)
  const siteName = payload.hybridGraph?.site_name || payload.openGraph?.site_name || payload.htmlInferred?.site_name
  const canonicalUrl = payload.hybridGraph?.url || payload.openGraph?.url || payload.htmlInferred?.url || normalizedUrl
  const typeHint = payload.hybridGraph?.type || payload.openGraph?.type || payload.htmlInferred?.type

  return {
    url: canonicalUrl,
    title,
    description,
    imageUrl,
    siteName,
    businessType: inferBusinessType(typeHint, title, description),
    category: inferCategory(typeHint, title, description)
  }
}