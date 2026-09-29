import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { graph, sym } from 'rdflib'
import './setup'
import { createHeadingEditDialog } from '../src/sections/heading/HeadingEditDialog'
import { createContactInfoEditDialog } from '../src/sections/contactInfo/ContactInfoEditDialog'
import type { ContactMutationPlan } from '../src/sections/contactInfo/types'
import type { HeadingMutationPlan, ProfileDetails } from '../src/sections/heading/types'
import { getSharedDialogCancelButton, getSharedDialogSaveButton } from '../src/ui/dialog'
import { flushAsync } from './helpers/dom'

const mockProcessHeadingMutations = vi.fn<(_: unknown, __: unknown, plan: HeadingMutationPlan) => Promise<void>>()
const mockProcessContactInfoMutations = vi.fn<(_: unknown, __: unknown, plan: ContactMutationPlan) => Promise<void>>()

vi.mock('../src/sections/heading/mutations', () => ({
  processHeadingMutations: (...args: Parameters<typeof mockProcessHeadingMutations>) => mockProcessHeadingMutations(...args)
}))

vi.mock('../src/sections/contactInfo/mutations', () => ({
  processContactInfoMutations: (...args: Parameters<typeof mockProcessContactInfoMutations>) => mockProcessContactInfoMutations(...args)
}))

function dispatchInput(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
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
    mockProcessHeadingMutations.mockResolvedValue(undefined)
    mockProcessContactInfoMutations.mockResolvedValue(undefined)
    document.body.innerHTML = ''
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
    await flushAsync()
    await flushAsync()

    const phoneInput = document.querySelector('input[name="phone-value"]') as HTMLInputElement | null
    if (!phoneInput) {
      throw new Error('Expected heading phone input to exist')
    }

    dispatchInput(phoneInput, '555 123 4567')

    getSharedDialogSaveButton(document)?.click()
    await flushAsync()
    await flushAsync()

    const errorBox = document.querySelector('#modal-error') as HTMLElement | null
    expect(errorBox?.textContent).toBe('Phone Number 1 should contain only numbers.')
    if (mockProcessHeadingMutations.mock.calls.length !== 0) {
      throw new Error('Expected heading mutations not to be called')
    }

    getSharedDialogCancelButton(document)?.click()
    await resultPromise
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
    await flushAsync()
    await flushAsync()

    const phoneInput = document.querySelector('input[name="phone-value-0"]') as HTMLInputElement | null
    if (!phoneInput) {
      throw new Error('Expected contact info phone input to exist')
    }

    dispatchInput(phoneInput, '555 123 4567')

    getSharedDialogSaveButton(document)?.click()
    await flushAsync()
    await flushAsync()

    const errorBox = document.querySelector('#modal-error') as HTMLElement | null
    expect(errorBox?.textContent).toBe('Phone Number 1 should contain only numbers.')
    if (mockProcessContactInfoMutations.mock.calls.length !== 0) {
      throw new Error('Expected contact info mutations not to be called')
    }

    getSharedDialogCancelButton(document)?.click()
    await resultPromise
  })
})
