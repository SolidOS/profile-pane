import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { graph, sym } from 'rdflib'
import { createHeadingEditDialog } from '../src/sections/heading/HeadingEditDialog'
import type { HeadingMutationPlan, ProfileDetails } from '../src/sections/heading/types'
import { getSharedDialogCancelButton, getSharedDialogSaveButton } from '../src/ui/dialog'
import { context, subject as viewedSubject } from './setup'
import type { LiveStore, NamedNode } from 'rdflib'

const mockProcessHeadingMutations = jest.fn<(_: unknown, __: unknown, plan: HeadingMutationPlan) => Promise<void>>()
const mockUploadPhotoFile = jest.fn<(store: LiveStore, subject: NamedNode, file: File) => Promise<string>>()
const mockResolvePhotoDisplaySrc = jest.fn<(store: LiveStore, imageSrc?: string) => Promise<string | undefined>>()
const mockInvalidateResolvedPhotoDisplaySrc = jest.fn<(imageSrc?: string) => void>()

jest.mock('../src/sections/heading/mutations', () => ({
  processHeadingMutations: (...args: Parameters<typeof mockProcessHeadingMutations>) => mockProcessHeadingMutations(...args)
}))

jest.mock('../src/sections/heading/imageHelpers', () => {
  const actual = jest.requireActual('../src/sections/heading/imageHelpers') as typeof import('../src/sections/heading/imageHelpers')

  return {
    ...actual,
    uploadPhotoFile: (...args: Parameters<typeof mockUploadPhotoFile>) => mockUploadPhotoFile(...args),
    resolvePhotoDisplaySrc: (...args: Parameters<typeof mockResolvePhotoDisplaySrc>) => mockResolvePhotoDisplaySrc(...args),
    invalidateResolvedPhotoDisplaySrc: (...args: Parameters<typeof mockInvalidateResolvedPhotoDisplaySrc>) => mockInvalidateResolvedPhotoDisplaySrc(...args)
  }
})

const actualImageHelpers = jest.requireActual('../src/sections/heading/imageHelpers') as typeof import('../src/sections/heading/imageHelpers')

async function flushUi() {
  await new Promise(resolve => setTimeout(resolve, 0))
  await new Promise(resolve => setTimeout(resolve, 0))
}

async function waitForFrame(): Promise<void> {
  await new Promise<void>((resolve) => {
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => resolve())
      return
    }

    setTimeout(resolve, 0)
  })
}

async function waitForDialog(): Promise<void> {
  await waitForFrame()
  await waitForFrame()
  await waitForFrame()
}

function createDialogEvent() {
  const trigger = document.createElement('button')
  document.body.appendChild(trigger)
  return new MouseEvent('click', { bubbles: true, composed: true })
}

describe('Heading edit dialog', () => {
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL

  beforeEach(() => {
    mockProcessHeadingMutations.mockReset()
    mockUploadPhotoFile.mockReset()
    mockResolvePhotoDisplaySrc.mockReset()
    mockInvalidateResolvedPhotoDisplaySrc.mockReset()

    mockProcessHeadingMutations.mockResolvedValue(undefined)
    mockUploadPhotoFile.mockResolvedValue('https://example.com/profile/avatar.png')
    mockResolvePhotoDisplaySrc.mockImplementation(actualImageHelpers.resolvePhotoDisplaySrc)
    mockInvalidateResolvedPhotoDisplaySrc.mockImplementation(actualImageHelpers.invalidateResolvedPhotoDisplaySrc)

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: jest.fn(() => 'blob:heading-preview')
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: jest.fn()
    })

    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
    actualImageHelpers.invalidateResolvedPhotoDisplaySrc('https://example.com/profile/original.png')
    actualImageHelpers.invalidateResolvedPhotoDisplaySrc('https://example.com/profile/existing.png')
    actualImageHelpers.invalidateResolvedPhotoDisplaySrc('https://example.com/private/avatar.png')

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: originalCreateObjectURL
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: originalRevokeObjectURL
    })

    jest.restoreAllMocks()
  })

  it('keeps the selected heading photo visible in the preview frame before save', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const profileData: ProfileDetails = {
      entryNode: subject,
      name: 'Jane Doe',
      imageSrc: 'https://example.com/profile/original.png'
    }

    const resultPromise = createHeadingEditDialog(createDialogEvent(), store, subject, profileData, 'owner')
    await flushUi()

    const uploadButton = document.querySelector('.profile-edit-dialog__image-upload-button') as HTMLElement | null
    expect(uploadButton).not.toBeNull()

    uploadButton?.click()
    await flushUi()

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null
    expect(fileInput).not.toBeNull()

    const file = new File(['image-bytes'], 'avatar.png', { type: 'image/png' })
    Object.defineProperty(fileInput as HTMLInputElement, 'files', {
      configurable: true,
      value: [file]
    })

    fileInput?.dispatchEvent(new Event('change', { bubbles: true }))
    await flushUi()

    const heroImage = document.querySelector('.profile-edit-dialog__image-frame .profile__hero') as HTMLImageElement | null
    expect(mockUploadPhotoFile).not.toHaveBeenCalled()
    expect(URL.createObjectURL).toHaveBeenCalledWith(file)
    expect(heroImage?.getAttribute('src')).toBe('blob:heading-preview')

    getSharedDialogSaveButton(document)?.click()
    await resultPromise

    expect(mockUploadPhotoFile).toHaveBeenCalledTimes(1)
    expect(mockUploadPhotoFile).toHaveBeenCalledWith(store, subject, file)
  })

  it('keeps the captured camera photo visible in the preview frame before save', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const profileData: ProfileDetails = {
      entryNode: subject,
      name: 'Jane Doe',
      imageSrc: 'https://example.com/profile/original.png'
    }

    const resultPromise = createHeadingEditDialog(createDialogEvent(), store, subject, profileData, 'owner')
    await flushUi()

    const cameraButton = document.querySelector('.profile-edit-dialog__image-camera-button') as HTMLElement | null
    expect(cameraButton).not.toBeNull()

    cameraButton?.click()
    await flushUi()

    const photoCapture = document.querySelector('solid-ui-photo-capture') as HTMLElement | null
    expect(photoCapture).not.toBeNull()

    const file = new File(['camera-image-bytes'], 'camera.png', { type: 'image/png' })
    photoCapture?.dispatchEvent(new CustomEvent('photo-captured', {
      detail: { file },
      bubbles: true
    }))
    await flushUi()

    const heroImage = document.querySelector('.profile-edit-dialog__image-frame .profile__hero') as HTMLImageElement | null
    expect(mockUploadPhotoFile).not.toHaveBeenCalled()
    expect(URL.createObjectURL).toHaveBeenCalledWith(file)
    expect(heroImage?.getAttribute('src')).toBe('blob:heading-preview')

    getSharedDialogSaveButton(document)?.click()
    await resultPromise

    expect(mockUploadPhotoFile).toHaveBeenCalledTimes(1)
    expect(mockUploadPhotoFile).toHaveBeenCalledWith(store, subject, file)
  })

  it('only persists removing the heading photo when save is pressed', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const profileData: ProfileDetails = {
      entryNode: subject,
      name: 'Jane Doe',
      imageSrc: 'https://example.com/profile/original.png'
    }

    const resultPromise = createHeadingEditDialog(createDialogEvent(), store, subject, profileData, 'owner')
    await flushUi()

    const removeButton = document.querySelector('.profile-edit-dialog__image-remove-button') as HTMLElement | null
    expect(removeButton).not.toBeNull()

    removeButton?.click()
    await flushUi()

    expect(mockProcessHeadingMutations).not.toHaveBeenCalled()
    expect(mockInvalidateResolvedPhotoDisplaySrc).not.toHaveBeenCalled()

    getSharedDialogSaveButton(document)?.click()
    await resultPromise

    expect(mockProcessHeadingMutations).toHaveBeenCalledTimes(1)
    const plan = mockProcessHeadingMutations.mock.calls[0][2]
    expect(plan.basicOps.update).toHaveLength(1)
    expect(plan.basicOps.update[0]?.imageSrc).toBe('')
    expect(mockInvalidateResolvedPhotoDisplaySrc).toHaveBeenCalledWith('https://example.com/profile/original.png')
  })

  it('shows an existing heading photo in the edit dialog when the display source resolves', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const profileData: ProfileDetails = {
      entryNode: subject,
      name: 'Jane Doe',
      imageSrc: 'https://example.com/profile/existing.png'
    }
    mockResolvePhotoDisplaySrc.mockResolvedValueOnce('blob:existing-heading-preview')

    const resultPromise = createHeadingEditDialog(createDialogEvent(), store, subject, profileData, 'owner')
    await flushUi()

    const heroImage = document.querySelector('.profile-edit-dialog__image-frame .profile__hero') as HTMLImageElement | null
    expect(mockResolvePhotoDisplaySrc).toHaveBeenCalledWith(store, 'https://example.com/profile/existing.png')
    expect(heroImage?.getAttribute('src')).toBe('blob:existing-heading-preview')

    getSharedDialogCancelButton(document)?.click()
    await resultPromise
  })

  it('persists default heading phone and email types when existing values have no stored type', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const profileData: ProfileDetails = {
      entryNode: subject,
      name: 'Jane Doe',
      primaryPhone: {
        entryNode: sym('https://example.com/profile/card#phone'),
        type: undefined as any,
        valueNode: sym('tel:5551234567')
      },
      primaryEmail: {
        entryNode: sym('https://example.com/profile/card#email'),
        type: undefined as any,
        valueNode: sym('mailto:jane@example.com')
      }
    }

    const resultPromise = createHeadingEditDialog(createDialogEvent(), store, subject, profileData, 'owner')
    await flushUi()

    getSharedDialogSaveButton(document)?.click()
    await resultPromise

    expect(mockProcessHeadingMutations).toHaveBeenCalledTimes(1)
    const plan = mockProcessHeadingMutations.mock.calls[0][2]
    expect(plan.phoneOps.update).toHaveLength(1)
    expect(plan.phoneOps.update[0]?.type).toBe('Cell')
    expect(plan.emailOps.update).toHaveLength(1)
    expect(plan.emailOps.update[0]?.type).toBe('Home')
  })

  it('does not revoke the resolved original photo blob when remove is cancelled', async () => {
    const fetchSpy = jest.spyOn((context.session.store.fetcher as any), '_fetch').mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['image-bytes'], { type: 'image/png' })
    } as Response)

    const createObjectUrlMock = jest.fn(() => 'blob:resolved-original')
    const revokeObjectUrlMock = jest.fn()

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrlMock
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrlMock
    })

    const profile = {
      entryNode: sym('https://example.com/profile#entry'),
      name: 'Jane Doe',
      nickname: 'Jane',
      imageSrc: 'https://example.com/private/avatar.png',
      location: 'Amsterdam',
      pronouns: 'She/Her'
    }

    const openOnce = createHeadingEditDialog(
      new Event('click'),
      context.session.store as any,
      viewedSubject,
      profile as any,
      'owner'
    )

    await waitForDialog()

    const removeButton = document.querySelector('.profile-edit-dialog__image-remove-button') as HTMLElement | null
    expect(removeButton).not.toBeNull()
    removeButton?.click()

    getSharedDialogCancelButton(document)?.click()
    await expect(openOnce).resolves.toBeUndefined()

    expect(fetchSpy).toHaveBeenCalledWith('https://example.com/private/avatar.png')
    expect(revokeObjectUrlMock).not.toHaveBeenCalledWith('blob:resolved-original')

    const openTwice = createHeadingEditDialog(
      new Event('click'),
      context.session.store as any,
      viewedSubject,
      profile as any,
      'owner'
    )

    await waitForDialog()

    const reopenedImage = document.querySelector('#profile-modal img.profile__hero') as HTMLImageElement | null
    expect(reopenedImage?.getAttribute('src')).toBe('blob:resolved-original')

    getSharedDialogCancelButton(document)?.click()
    await expect(openTwice).resolves.toBeUndefined()
  })
})
