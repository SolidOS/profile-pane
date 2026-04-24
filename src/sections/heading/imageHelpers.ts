import { LiveStore, NamedNode, sym } from 'rdflib'
import { ns } from 'solid-ui'
/* Code copied from contact-pane/src/mugshotGallery and modified to fit the needs of the new design */
const mimeMap: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/html': 'html',
  'application/json': 'json',
  'application/octet-stream': 'bin'
}

const extMap = Object.fromEntries(
  Object.entries(mimeMap).map(([contentType, extension]) => [extension, contentType])
) as Record<string, string>

const mime = {
  extension: (contentType: string): string | false => mimeMap[contentType] || false,
  lookup: (filename: string): string | false => {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    return extMap[ext] || false
  }
}

function subjectDirectoryUri(subject: NamedNode): string {
  const docUri = subject.doc().uri
  const lastSlash = docUri.lastIndexOf('/')
  return lastSlash >= 0 ? docUri.slice(0, lastSlash + 1) : docUri
}

export async function uploadPhotoFile(store: LiveStore, subject: NamedNode, file: File): Promise<string> {
  if (!store.fetcher) {
    throw new Error('Store has no fetcher.')
  }

  const detectedContentType = file.type || mime.lookup(file.name) || 'application/octet-stream'
  if (!detectedContentType.startsWith('image/')) {
    throw new Error('Selected file is not an image.')
  }

  const extension = mime.extension(detectedContentType) || 'bin'
  let filename = encodeURIComponent(file.name || `image.${extension}`)

  if (detectedContentType !== mime.lookup(file.name || '')) {
    filename += `_.${extension}`
  }

  const directoryUri = subjectDirectoryUri(subject)
  let candidateUri = `${directoryUri}${filename}`

  for (let index = 0; store.holds(subject, ns.vcard('hasPhoto'), sym(candidateUri)); index++) {
    const fallbackName = `image_${index}.${extension}`
    candidateUri = `${directoryUri}${fallbackName}`
  }
  try {
    const data = await file.arrayBuffer()
    const response = await store.fetcher.webOperation('PUT', candidateUri, {
      data: data as unknown as string,
      contentType: detectedContentType
    } as any)
    if (!response.ok) {
      throw new Error(`Error uploading picture: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    throw new Error(`Error uploading picture: ${error}`)
  }
  
  return candidateUri
}

export async function deletePhotoFile(store: LiveStore, subject: NamedNode, photoUri: string): Promise<void> {
  void subject
  if (!photoUri) return

  if (store.fetcher) {
    try {
      await store.fetcher.webOperation('DELETE', photoUri)
    } catch (error) {
      console.error(`Error deleting picture: ${error}`)
    }
    
  }
}

