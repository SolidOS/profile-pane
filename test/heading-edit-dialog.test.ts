import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { graph, sym } from 'rdflib'
import { createHeadingEditDialog } from '../src/sections/heading/HeadingEditDialog'
import type { HeadingMutationPlan, ProfileDetails } from '../src/sections/heading/types'
import { getSharedDialogCancelButton, getSharedDialogSaveButton } from '../src/ui/dialog'

const mockProcessHeadingMutations = jest.fn<(_: unknown, __: unknown, plan: HeadingMutationPlan) => Promise<void>>()
const mockUploadPhotoFile = jest.fn<(_: unknown, __: unknown, ___: File) => Promise<string>>()
const mockCopyPhotoToProfileContainer = jest.fn<(_: unknown, __: unknown, photoUri: string) => Promise<string>>()
const mockMoveProfileImagesToPhotoContainer = jest.fn<(_: unknown, __: unknown) => Promise<Map<string, string>>>()
const mockShouldStorePhotoInProfileContainer = jest.fn<(_: unknown, __?: string) => boolean>()
const mockResolvePhotoDisplaySrc = jest.fn<(_: unknown, __?: string) => Promise<string | undefined>>()

jest.mock('../src/sections/heading/mutations', () => ({
  processHeadingMutations: (...args: Parameters<typeof mockProcessHeadingMutations>) => mockProcessHeadingMutations(...args)
}))

jest.mock('../src/sections/heading/imageHelpers', () => ({
  uploadPhotoFile: (...args: Parameters<typeof mockUploadPhotoFile>) => mockUploadPhotoFile(...args),
  copyPhotoToProfileContainer: (...args: Parameters<typeof mockCopyPhotoToProfileContainer>) => mockCopyPhotoToProfileContainer(...args),
  moveProfileImagesToPhotoContainer: (...args: Parameters<typeof mockMoveProfileImagesToPhotoContainer>) => mockMoveProfileImagesToPhotoContainer(...args),
  shouldStorePhotoInProfileContainer: (...args: Parameters<typeof mockShouldStorePhotoInProfileContainer>) => mockShouldStorePhotoInProfileContainer(...args),
  resolvePhotoDisplaySrc: (...args: Parameters<typeof mockResolvePhotoDisplaySrc>) => mockResolvePhotoDisplaySrc(...args)
}))

async function flushUi() {
  await new Promise(resolve => setTimeout(resolve, 0))
  await new Promise(resolve => setTimeout(resolve, 0))
}

function createDialogEvent() {
  const trigger = document.createElement('button')
  document.body.appendChild(trigger)
  return new MouseEvent('click', { bubbles: true, composed: true })
}

describe('heading edit dialog', () => {
  beforeEach(() => {
    mockProcessHeadingMutations.mockReset()
    mockUploadPhotoFile.mockReset()
    mockCopyPhotoToProfileContainer.mockReset()
    mockMoveProfileImagesToPhotoContainer.mockReset()
    mockShouldStorePhotoInProfileContainer.mockReset()
    mockResolvePhotoDisplaySrc.mockReset()
    mockProcessHeadingMutations.mockResolvedValue(undefined)
    mockUploadPhotoFile.mockResolvedValue('https://example.com/profile/avatar.png')
    mockCopyPhotoToProfileContainer.mockImplementation(async (_store, _subject, photoUri) => photoUri)
    mockMoveProfileImagesToPhotoContainer.mockResolvedValue(new Map())
    mockShouldStorePhotoInProfileContainer.mockReturnValue(false)
    mockResolvePhotoDisplaySrc.mockImplementation(async (_store, imageSrc) => imageSrc)

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: jest.fn(() => 'blob:heading-preview')
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: jest.fn()
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('shows a numbered validation error when the heading phone contains spaces', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const profileData: ProfileDetails = {
      entryNode: subject,
      name: 'Jane Doe'
    }

    const resultPromise = createHeadingEditDialog(createDialogEvent(), store, subject, profileData, 'owner')
    await flushUi()

    const phoneInput = document.querySelector('input[name="phone-value"]') as HTMLInputElement | null
    expect(phoneInput).not.toBeNull()

    phoneInput!.value = '555 123 4567'
    phoneInput!.dispatchEvent(new Event('input', { bubbles: true }))

    getSharedDialogSaveButton(document)?.click()
    await flushUi()

    const errorBox = document.querySelector('#modal-error') as HTMLElement | null
    expect(errorBox?.textContent).toBe('Phone Number 1 should contain only numbers.')
    expect(mockProcessHeadingMutations).not.toHaveBeenCalled()

    getSharedDialogCancelButton(document)?.click()
    await resultPromise
  })

  it('keeps the uploaded heading photo visible in the preview frame', async () => {
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

    getSharedDialogCancelButton(document)?.click()
    await resultPromise
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

  it('does not revoke cached resolved photo URLs when the dialog is cancelled', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const profileData: ProfileDetails = {
      entryNode: subject,
      name: 'Jane Doe',
      imageSrc: 'https://example.com/profile/existing.png'
    }
    const revokeObjectURL = jest.fn()
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL
    })
    mockResolvePhotoDisplaySrc.mockResolvedValueOnce('blob:existing-heading-preview')

    const resultPromise = createHeadingEditDialog(createDialogEvent(), store, subject, profileData, 'owner')
    await flushUi()

    getSharedDialogCancelButton(document)?.click()
    await resultPromise

    expect(revokeObjectURL).not.toHaveBeenCalled()
  })

  it('does not save or upload when the photo is removed and the dialog is cancelled', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const profileData: ProfileDetails = {
      entryNode: subject,
      name: 'Jane Doe',
      imageSrc: 'https://example.com/profile/original.png'
    }
    const onSaved = jest.fn(async () => undefined)

    const resultPromise = createHeadingEditDialog(createDialogEvent(), store, subject, profileData, 'owner', onSaved)
    await flushUi()

    const removeButton = document.querySelector('.profile-edit-dialog__image-remove-button') as HTMLElement | null
    expect(removeButton).not.toBeNull()

    removeButton?.click()
    await flushUi()

    getSharedDialogCancelButton(document)?.click()
    await resultPromise

    expect(mockProcessHeadingMutations).not.toHaveBeenCalled()
    expect(mockUploadPhotoFile).not.toHaveBeenCalled()
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('only applies the photo removal when save is executed', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const profileData: ProfileDetails = {
      entryNode: subject,
      name: 'Jane Doe',
      imageSrc: 'https://example.com/profile/original.png'
    }
    const onSaved = jest.fn(async () => undefined)

    const resultPromise = createHeadingEditDialog(createDialogEvent(), store, subject, profileData, 'owner', onSaved)
    await flushUi()

    const removeButton = document.querySelector('.profile-edit-dialog__image-remove-button') as HTMLElement | null
    expect(removeButton).not.toBeNull()

    removeButton?.click()
    await flushUi()

    getSharedDialogSaveButton(document)?.click()
    await resultPromise

    expect(mockProcessHeadingMutations).toHaveBeenCalledTimes(1)
    expect(mockUploadPhotoFile).not.toHaveBeenCalled()
    expect(mockMoveProfileImagesToPhotoContainer).not.toHaveBeenCalled()
    expect(mockCopyPhotoToProfileContainer).not.toHaveBeenCalled()
    const plan = mockProcessHeadingMutations.mock.calls[0][2]
    expect(plan.basicOps.update).toHaveLength(1)
    expect(plan.basicOps.update[0]?.imageSrc).toBe('')
    expect(onSaved).toHaveBeenCalledTimes(1)
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
})
