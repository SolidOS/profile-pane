import { LiveStore, NamedNode, Namespace, sym } from 'rdflib'
import { authn, solidLogicSingleton } from 'solid-logic'
import { error as debugError } from '../../utils/debug'

const resolvedHeadingImageCache = new Map<string, string>()
const PROFILE_PHOTOS_CONTAINER_NAME = 'profileFotos'
const ldp = Namespace('http://www.w3.org/ns/ldp#')
const ROOT_PROFILE_IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'tiff'])

export type PreparedPhotoMigration = {
  migratedPhotoUris: Map<string, string>
  finalize: () => Promise<void>
}

export type PodPhotoOption = {
  uri: string
  label: string
}
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

function subjectContainerUri(subject: NamedNode): string {
  const docUri = subject.doc().uri
  const lastSlash = docUri.lastIndexOf('/')
  return lastSlash >= 0 ? docUri.slice(0, lastSlash + 1) : docUri
}

function photoContainerUri(subject: NamedNode): string {
  return `${subjectContainerUri(subject)}${PROFILE_PHOTOS_CONTAINER_NAME}/`
}

function isDirectChildResource(containerUri: string, resourceUri: string): boolean {
  if (!resourceUri.startsWith(containerUri)) {
    return false
  }

  const containerPath = new URL(containerUri).pathname
  const resourcePath = new URL(resourceUri).pathname
  const relativePath = resourcePath.slice(containerPath.length)

  return Boolean(relativePath) && !relativePath.includes('/')
}

async function setPhotoContainerPublicAcl(
  subject: NamedNode,
  currentUser: NamedNode
): Promise<void> {
  try {
    await solidLogicSingleton.acl.setACLUserPublic(photoContainerUri(subject), currentUser, {
      defaultForNew: true,
      public: ['Read'] as unknown as []
    })
  } catch (error) {
    debugError(`Error setting photo container permissions: ${error}`)
  }
}

function candidateFilename(filenameHint: string, contentType: string): string {
  const extension = mime.extension(contentType) || 'bin'
  const normalizedFilename = filenameHint.trim() || `image.${extension}`
  let filename = encodeURIComponent(normalizedFilename)

  if (contentType !== mime.lookup(normalizedFilename)) {
    filename += `_.${extension}`
  }

  return filename
}

function splitFilename(filename: string): { basename: string, extension: string } {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot <= 0 || lastDot === filename.length - 1) {
    return { basename: filename, extension: '' }
  }

  return {
    basename: filename.slice(0, lastDot),
    extension: filename.slice(lastDot)
  }
}

function fileExtension(resourceUri: string): string {
  const pathname = new URL(resourceUri).pathname
  const filename = pathname.split('/').pop() || ''
  const lastDot = filename.lastIndexOf('.')
  if (lastDot < 0 || lastDot === filename.length - 1) {
    return ''
  }

  return filename.slice(lastDot + 1).toLowerCase()
}

function decodeFilename(resourceUri: string): string {
  const pathname = new URL(resourceUri).pathname
  const filename = pathname.split('/').pop() || resourceUri
  try {
    return decodeURIComponent(filename)
  } catch {
    return filename
  }
}

function isPodPhotoResource(resourceUri: string): boolean {
  if (resourceUri.endsWith('/')) {
    return false
  }

  if (resourceUri.endsWith('.acl')) {
    return false
  }

  return ROOT_PROFILE_IMAGE_EXTENSIONS.has(fileExtension(resourceUri))
}

function isRootProfileImageResource(subject: NamedNode, resourceUri: string): boolean {
  if (!shouldStorePhotoInProfileContainer(subject, resourceUri)) {
    return false
  }

  if (!isDirectChildResource(subjectContainerUri(subject), resourceUri)) {
    return false
  }

  return ROOT_PROFILE_IMAGE_EXTENSIONS.has(fileExtension(resourceUri))
}

function dedicatedAclUri(resourceUri: string): string {
  return `${resourceUri}.acl`
}

function rewriteAclDocument(
  aclText: string,
  sourceResourceUri: string,
  destinationResourceUri: string,
  sourceAclUri: string,
  destinationAclUri: string
): string {
  return aclText
    .split(sourceAclUri).join(destinationAclUri)
    .split(sourceResourceUri).join(destinationResourceUri)
}

async function resourceExists(
  fetcher: { webOperation?: any },
  resourceUri: string
): Promise<boolean> {
  if (!fetcher.webOperation) {
    return false
  }

  try {
    const response = await fetcher.webOperation('HEAD', resourceUri)
    return Boolean(response?.ok)
  } catch {
    return false
  }
}

async function deleteResource(
  fetcher: { delete?: (uri: string) => Promise<any>, webOperation?: any },
  resourceUri: string
): Promise<void> {
  if (fetcher.delete) {
    const response = await fetcher.delete(resourceUri)
    if (response?.ok) {
      return
    }

    throw new Error(`Error deleting original picture: ${response?.status} ${response?.statusText}`)
  }

  if (!fetcher.webOperation) {
    throw new Error('Store fetcher does not support deleting the original photo.')
  }

  const response = await fetcher.webOperation('DELETE', resourceUri)
  if (!response?.ok) {
    throw new Error(`Error deleting original picture: ${response?.status} ${response?.statusText}`)
  }
}

async function ensurePhotoContainerExists(
  fetcher: { webOperation?: any, createContainer?: (parentURI: string, folderName: string, data: string) => Promise<any>, _fetch?: any },
  containerUri: string
): Promise<boolean> {
  const containerExisted = await resourceExists(fetcher, containerUri)
  if (containerExisted) {
    return containerExisted
  }

  const trimmedContainerUri = containerUri.endsWith('/') ? containerUri.slice(0, -1) : containerUri
  const lastSlash = trimmedContainerUri.lastIndexOf('/')
  const parentUri = trimmedContainerUri.slice(0, lastSlash + 1)
  const folderName = decodeURIComponent(trimmedContainerUri.slice(lastSlash + 1))

  if (fetcher.createContainer) {
    const response = await fetcher.createContainer(parentUri, folderName, '')
    if (response?.status?.toString?.()[0] !== '2' && response?.status !== 409) {
      throw new Error(`Error creating photo container: ${response?.status} ${response?.statusText}`)
    }
    return false
  }

  if (fetcher._fetch) {
    const response = await fetcher._fetch(containerUri, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/turtle',
        'If-None-Match': '*',
        Link: '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"'
      },
      body: ' '
    })
    if (response?.status?.toString?.()[0] !== '2' && response?.status !== 409) {
      throw new Error(`Error creating photo container: ${response?.status} ${response?.statusText}`)
    }
    return false
  }

  if (!fetcher.webOperation) {
    throw new Error('Store fetcher does not support creating the photo container.')
  }

  throw new Error('Store fetcher does not support creating the photo container.')
}

async function findAvailablePhotoUri(
  fetcher: { webOperation?: any },
  containerUri: string,
  filename: string
): Promise<string> {
  const { basename, extension } = splitFilename(filename)
  let candidateUri = `${containerUri}${filename}`

  for (let index = 1; await resourceExists(fetcher, candidateUri); index += 1) {
    candidateUri = `${containerUri}${basename}_${index}${extension}`
  }

  return candidateUri
}

async function uploadPhotoBlob(
  store: LiveStore,
  subject: NamedNode,
  imageBlob: Blob,
  filenameHint: string,
  contentTypeHint?: string
): Promise<string> {
  const fetcher = store.fetcher as { webOperation?: any } | undefined
  if (!fetcher?.webOperation) {
    throw new Error('Store has no fetcher.')
  }

  const detectedContentType = contentTypeHint || imageBlob.type || mime.lookup(filenameHint) || 'application/octet-stream'
  if (!detectedContentType.startsWith('image/')) {
    throw new Error('Selected file is not an image.')
  }

  const containerUri = photoContainerUri(subject)
  const containerExisted = await ensurePhotoContainerExists(fetcher, containerUri)
  const currentUser = authn.currentUser()

  if (containerExisted && currentUser) {
    await setPhotoContainerPublicAcl(subject, currentUser)
  }

  const filename = candidateFilename(filenameHint, detectedContentType)
  const candidateUri = await findAvailablePhotoUri(fetcher, containerUri, filename)

  try {
    const data = typeof imageBlob.arrayBuffer === 'function'
      ? await imageBlob.arrayBuffer()
      : await new Response(imageBlob).arrayBuffer()
    const response = await fetcher.webOperation('PUT', candidateUri, {
      data: data as unknown as string,
      contentType: detectedContentType
    } as any)

    if (!response.ok) {
      throw new Error(`Error uploading picture: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    throw new Error(`Error uploading picture: ${error}`)
  }

  if (currentUser) {
    if (!containerExisted) {
      await setPhotoContainerPublicAcl(subject, currentUser)

      try {
        await solidLogicSingleton.acl.setACLUserPublic(candidateUri, currentUser, {
          public: ['Read'] as unknown as []
        })
      } catch (error) {
        debugError(`Error setting uploaded picture permissions: ${error}`)
      }
    }
  }

  return candidateUri
}

async function copyDedicatedAclIfPresent(
  store: LiveStore,
  sourceResourceUri: string,
  destinationResourceUri: string
): Promise<boolean> {
  const fetcher = store.fetcher as { _fetch?: (url: string) => Promise<Response>, webOperation?: any } | undefined
  if (!fetcher?._fetch || !fetcher.webOperation) {
    return false
  }

  const sourceAcl = dedicatedAclUri(sourceResourceUri)
  const destinationAcl = dedicatedAclUri(destinationResourceUri)

  try {
    const aclResponse = await fetcher._fetch(sourceAcl)
    if (!aclResponse.ok) {
      return false
    }

    const aclText = await aclResponse.text()
    const rewrittenAclText = rewriteAclDocument(
      aclText,
      sourceResourceUri,
      destinationResourceUri,
      sourceAcl,
      destinationAcl
    )
    const writeResponse = await fetcher.webOperation('PUT', destinationAcl, {
      data: rewrittenAclText,
      contentType: 'text/turtle'
    } as any)

    if (!writeResponse?.ok) {
      throw new Error(`Error writing ACL text: ${writeResponse?.status} ${writeResponse?.statusText}`)
    }

    return true
  } catch (error) {
    debugError(`Error copying picture ACL: ${error}`)
    return false
  }
}

async function moveRootProfileImageToPhotoContainer(
  store: LiveStore,
  subject: NamedNode,
  photoUri: string
): Promise<{ destinationUri: string, finalize: () => Promise<void> }> {
  const fetcher = store.fetcher as { _fetch?: (url: string) => Promise<Response>, delete?: (uri: string) => Promise<any>, webOperation?: any } | undefined
  if (!fetcher?._fetch || !fetcher.webOperation) {
    throw new Error('Store fetcher does not support moving the existing photo.')
  }

  const response = await fetcher._fetch(photoUri)
  if (!response.ok) {
    throw new Error(`Error reading existing picture: ${response.status} ${response.statusText}`)
  }

  const imageBlob = await response.blob()
  const url = new URL(photoUri)
  const sourceFilename = decodeURIComponent(url.pathname.split('/').pop() || 'image')
  const contentType = response.headers.get('content-type') || imageBlob.type || mime.lookup(sourceFilename) || 'application/octet-stream'
  const destinationUri = await uploadPhotoBlob(store, subject, imageBlob, sourceFilename, contentType)
  await copyDedicatedAclIfPresent(store, photoUri, destinationUri)

  const destinationExists = await resourceExists(fetcher, destinationUri)
  if (!destinationExists) {
    throw new Error(`Error verifying migrated picture: ${destinationUri}`)
  }

  return {
    destinationUri,
    finalize: async () => {
      await deleteResource(fetcher, photoUri)
    }
  }
}

export function shouldStorePhotoInProfileContainer(subject: NamedNode, photoUri?: string): boolean {
  const normalizedPhotoUri = (photoUri || '').trim()
  if (!normalizedPhotoUri || normalizedPhotoUri.startsWith('blob:') || normalizedPhotoUri.startsWith('data:')) {
    return false
  }

  const subjectContainer = subjectContainerUri(subject)
  const photosContainer = photoContainerUri(subject)

  return normalizedPhotoUri.startsWith(subjectContainer) && !normalizedPhotoUri.startsWith(photosContainer)
}

export async function resolvePhotoDisplaySrc(store: LiveStore, imageSrc?: string): Promise<string | undefined> {
  if (!imageSrc || imageSrc.startsWith('blob:') || imageSrc.startsWith('data:')) {
    return imageSrc
  }

  const cachedImageSrc = resolvedHeadingImageCache.get(imageSrc)
  if (cachedImageSrc) {
    return cachedImageSrc
  }

  const fetcher = store.fetcher as { _fetch?: (url: string) => Promise<Response> } | undefined
  if (!fetcher?._fetch || typeof URL.createObjectURL !== 'function') {
    return imageSrc
  }

  try {
    const response = await fetcher._fetch(imageSrc)
    if (!response.ok) {
      return imageSrc
    }

    const imageBlob = await response.blob()
    const resolvedImageSrc = URL.createObjectURL(imageBlob)
    resolvedHeadingImageCache.set(imageSrc, resolvedImageSrc)
    return resolvedImageSrc
  } catch {
    return imageSrc
  }
}

export async function uploadPhotoFile(store: LiveStore, subject: NamedNode, file: File): Promise<string> {
  return uploadPhotoBlob(store, subject, file, file.name || 'image')
}

export async function listPodPhotoOptions(store: LiveStore, subject: NamedNode): Promise<PodPhotoOption[]> {
  const fetcher = store.fetcher as { load?: (resource: NamedNode) => Promise<any> } | undefined
  if (!fetcher?.load || typeof (store as any).each !== 'function') {
    return []
  }

  const subjectContainerNode = sym(subjectContainerUri(subject))
  const photosContainerNode = sym(photoContainerUri(subject))

  await fetcher.load(subjectContainerNode)
  try {
    await fetcher.load(photosContainerNode)
  } catch {
    // Profiles without a dedicated photo container should still be able to pick legacy images.
  }

  const uniquePhotos = new Map<string, PodPhotoOption>()
  const containerNodes = [subjectContainerNode, photosContainerNode]

  for (const containerNode of containerNodes) {
    const containedResources = ((store as any).each(containerNode, ldp('contains')) as NamedNode[])
      .map((resource) => resource.uri)
      .filter((resourceUri) => isPodPhotoResource(resourceUri))

    for (const resourceUri of containedResources) {
      if (!uniquePhotos.has(resourceUri)) {
        uniquePhotos.set(resourceUri, {
          uri: resourceUri,
          label: decodeFilename(resourceUri)
        })
      }
    }
  }

  return Array.from(uniquePhotos.values()).sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }))
}

export async function copyPhotoToProfileContainer(store: LiveStore, subject: NamedNode, photoUri: string): Promise<PreparedPhotoMigration> {
  if (!shouldStorePhotoInProfileContainer(subject, photoUri)) {
    return {
      migratedPhotoUris: new Map([[photoUri, photoUri]]),
      finalize: async () => undefined
    }
  }

  const preparedMigration = await moveRootProfileImageToPhotoContainer(store, subject, photoUri)

  return {
    migratedPhotoUris: new Map([[photoUri, preparedMigration.destinationUri]]),
    finalize: preparedMigration.finalize
  }
}

// This runs once for older profiles so their root-level image files conform to the
// newer dedicated profile image container: profile/profileFotos/.
async function migrateLegacyProfileImagesToPhotoContainer(
  store: LiveStore,
  subject: NamedNode,
  legacyPhotoUris: string[]
): Promise<PreparedPhotoMigration> {
  const migratedPhotos = new Map<string, string>()
  const finalizeOperations: Array<() => Promise<void>> = []

  for (const resourceUri of legacyPhotoUris) {
    const preparedMigration = await moveRootProfileImageToPhotoContainer(store, subject, resourceUri)
    migratedPhotos.set(resourceUri, preparedMigration.destinationUri)
    finalizeOperations.push(preparedMigration.finalize)
  }

  return {
    migratedPhotoUris: migratedPhotos,
    finalize: async () => {
      for (const finalizeOperation of finalizeOperations) {
        await finalizeOperation()
      }
    }
  }
}

export async function moveProfileImagesToPhotoContainer(store: LiveStore, subject: NamedNode): Promise<PreparedPhotoMigration> {
  const fetcher = store.fetcher as { load?: (resource: NamedNode) => Promise<any> } | undefined
  if (!fetcher?.load || typeof (store as any).each !== 'function') {
    return {
      migratedPhotoUris: new Map<string, string>(),
      finalize: async () => undefined
    }
  }

  const containerNode = sym(subjectContainerUri(subject))
  await fetcher.load(containerNode)

  const legacyPhotoUris = ((store as any).each(containerNode, ldp('contains')) as NamedNode[])
    .map((resource) => resource.uri)
    .filter((resourceUri) => isRootProfileImageResource(subject, resourceUri))

  return migrateLegacyProfileImagesToPhotoContainer(store, subject, legacyPhotoUris)
}
