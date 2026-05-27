import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { graph, sym } from 'rdflib'
import { createContactInfoEditDialog } from '../src/sections/contactInfo/ContactInfoEditDialog'
import type { ContactMutationPlan } from '../src/sections/contactInfo/types'
import { getSharedDialogCancelButton, getSharedDialogSaveButton } from '../src/ui/dialog'

const mockProcessContactInfoMutations = jest.fn<(_: unknown, __: unknown, plan: ContactMutationPlan) => Promise<void>>()

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

describe('contact info edit dialog', () => {
  beforeEach(() => {
    mockProcessContactInfoMutations.mockReset()
    mockProcessContactInfoMutations.mockResolvedValue(undefined)
  })

  afterEach(() => {
    document.body.innerHTML = ''
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