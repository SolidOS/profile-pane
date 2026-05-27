import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { graph, sym } from 'rdflib'
import { createHeadingEditDialog } from '../src/sections/heading/HeadingEditDialog'
import { createContactInfoEditDialog } from '../src/sections/contactInfo/ContactInfoEditDialog'
import type { ContactMutationPlan } from '../src/sections/contactInfo/types'
import type { HeadingMutationPlan, ProfileDetails } from '../src/sections/heading/types'
import { getSharedDialogCancelButton, getSharedDialogSaveButton } from '../src/ui/dialog'

const mockProcessHeadingMutations = jest.fn<(_: unknown, __: unknown, plan: HeadingMutationPlan) => Promise<void>>()
const mockProcessContactInfoMutations = jest.fn<(_: unknown, __: unknown, plan: ContactMutationPlan) => Promise<void>>()
const mockUploadPhotoFile = jest.fn<(_: unknown, __: unknown, ___: File) => Promise<string>>()
const mockDeletePhotoFile = jest.fn<(_: unknown, __: unknown, ___: string) => Promise<void>>()
const mockResolvePhotoDisplaySrc = jest.fn<(_: unknown, __?: string) => Promise<string | undefined>>()

jest.mock('../src/sections/heading/mutations', () => ({
  processHeadingMutations: (...args: Parameters<typeof mockProcessHeadingMutations>) => mockProcessHeadingMutations(...args)
}))

jest.mock('../src/sections/contactInfo/mutations', () => ({
  processContactInfoMutations: (...args: Parameters<typeof mockProcessContactInfoMutations>) => mockProcessContactInfoMutations(...args)
}))

jest.mock('../src/sections/heading/imageHelpers', () => ({
  uploadPhotoFile: (...args: Parameters<typeof mockUploadPhotoFile>) => mockUploadPhotoFile(...args),
  deletePhotoFile: (...args: Parameters<typeof mockDeletePhotoFile>) => mockDeletePhotoFile(...args),
  resolvePhotoDisplaySrc: (...args: Parameters<typeof mockResolvePhotoDisplaySrc>) => mockResolvePhotoDisplaySrc(...args)
}))

function dispatchInput(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

async function flushUi() {
  await new Promise(resolve => setTimeout(resolve, 0))
  await new Promise(resolve => setTimeout(resolve, 0))
}

function createDialogEvent() {
  const trigger = document.createElement('button')
  document.body.appendChild(trigger)
  return new MouseEvent('click', { bubbles: true, composed: true })
}

describe('Edit dialog phone value regression', () => {
  beforeEach(() => {
    mockProcessHeadingMutations.mockReset()
    mockProcessContactInfoMutations.mockReset()
    mockUploadPhotoFile.mockReset()
    mockDeletePhotoFile.mockReset()
    mockResolvePhotoDisplaySrc.mockReset()
    mockProcessHeadingMutations.mockResolvedValue(undefined)
    mockProcessContactInfoMutations.mockResolvedValue(undefined)
    mockUploadPhotoFile.mockResolvedValue('https://example.com/profile/avatar.png')
    mockDeletePhotoFile.mockResolvedValue(undefined)
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

    dispatchInput(phoneInput as HTMLInputElement, '555 123 4567')

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
    expect(mockUploadPhotoFile).toHaveBeenCalledTimes(1)
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

  it('shows a numbered validation error when the contact info phone contains spaces', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const resultPromise = createContactInfoEditDialog(
      new MouseEvent('click', { bubbles: true, composed: true }),
      store,
      subject,
      { emails: [], phones: [], addresses: [] },
      'owner'
    )
    await flushUi()

    const phoneInput = document.querySelector('input[name="phone-value-0"]') as HTMLInputElement | null
    expect(phoneInput).not.toBeNull()

    dispatchInput(phoneInput as HTMLInputElement, '555 123 4567')

    getSharedDialogSaveButton(document)?.click()
    await flushUi()

    const errorBox = document.querySelector('#modal-error') as HTMLElement | null
    expect(errorBox?.textContent).toBe('Phone Number 1 should contain only numbers.')
    expect(mockProcessContactInfoMutations).not.toHaveBeenCalled()

    getSharedDialogCancelButton(document)?.click()
    await resultPromise
  })
})