import { describe, expect, it } from "@jest/globals"
import { graph, sym } from 'rdflib'
import { presentLanguages } from '../../src/sections/languages/selectors'
import { processLanguageMutations } from '../../src/sections/languages/mutations'
import { mutationSaveLanguagesFailedPrefixText } from '../../src/texts'

describe('Languages selectors and mutations', () => {
  it('selector returns empty list from empty store', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    expect(presentLanguages(subject, store)).toEqual([])
  })

  it('mutation wraps updater errors with language prefix', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    const plan = { create: [], update: [], remove: [] }
    await expect(processLanguageMutations(store, subject, plan as any)).rejects.toThrow(
      mutationSaveLanguagesFailedPrefixText
    )
  })
})
