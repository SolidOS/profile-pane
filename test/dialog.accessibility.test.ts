import { describe, expect, it } from '@jest/globals'
import axe from 'axe-core'
import { openInputDialog } from '../src/ui/dialog'

describe('Dialog accessibility', () => {
  it('has no accessibility violations for the shared input dialog', async () => {
    const form = document.createElement('form')
    const label = document.createElement('label')
    label.textContent = 'Display name'
    const input = document.createElement('input')
    input.name = 'displayName'
    label.appendChild(input)
    form.appendChild(label)

    const resultPromise = openInputDialog({
      title: 'Edit display name',
      dom: document,
      form,
      headerAction: { type: 'none' }
    })

    const dialog = document.querySelector('#profile-modal') as HTMLDialogElement | null
    expect(dialog).not.toBeNull()

    const results = await axe.run(document.body)
    expect(results.violations.length).toBe(0)

    const cancelButton = document.querySelector('#modal-buttons button[data-cancel]') as HTMLButtonElement | null
    cancelButton?.click()

    await expect(resultPromise).resolves.toBeNull()
  })
})
