import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { graph, sym } from 'rdflib'
import { createHeadingEditDialog } from '../src/sections/heading/HeadingEditDialog'
import { createContactInfoEditDialog } from '../src/sections/contactInfo/ContactInfoEditDialog'
import type { ContactMutationPlan } from '../src/sections/contactInfo/types'
import type { HeadingMutationPlan, ProfileDetails } from '../src/sections/heading/types'
import { getSharedDialogSaveButton } from '../src/ui/dialog'

const mockProcessHeadingMutations = jest.fn<(_: unknown, __: unknown, plan: HeadingMutationPlan) => Promise<void>>()
const mockProcessContactInfoMutations = jest.fn<(_: unknown, __: unknown, plan: ContactMutationPlan) => Promise<void>>()

jest.mock('../src/sections/heading/mutations', () => ({
  processHeadingMutations: (...args: Parameters<typeof mockProcessHeadingMutations>) => mockProcessHeadingMutations(...args)
}))

jest.mock('../src/sections/contactInfo/mutations', () => ({
  processContactInfoMutations: (...args: Parameters<typeof mockProcessContactInfoMutations>) => mockProcessContactInfoMutations(...args)
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
    mockProcessHeadingMutations.mockResolvedValue(undefined)
    mockProcessContactInfoMutations.mockResolvedValue(undefined)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('saves the heading phone exactly as typed when no country code is entered', async () => {
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
    await resultPromise

    expect(mockProcessHeadingMutations).toHaveBeenCalledTimes(1)
    const plan = mockProcessHeadingMutations.mock.calls[0][2]
    expect(plan.phoneOps.create).toHaveLength(1)
    expect(plan.phoneOps.create[0]?.value).toBe('555 123 4567')
  })

  it('saves the contact info phone exactly as typed when no country code is entered', async () => {
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
    await resultPromise

    expect(mockProcessContactInfoMutations).toHaveBeenCalledTimes(1)
    const plan = mockProcessContactInfoMutations.mock.calls[0][2]
    expect(plan.phoneOps.create).toHaveLength(1)
    expect(plan.phoneOps.create[0]?.value).toBe('555 123 4567')
  })
})