import { describe, expect, it } from "@jest/globals"
import { graph, sym } from 'rdflib'
import { presentBio } from '../../src/sections/bio/selectors'
import { processBioMutations } from '../../src/sections/bio/mutations'
import { saveBioUpdatesFailedPrefixText } from '../../src/texts'

describe('Bio selectors and mutations', () => {
  it('selector returns empty bio details from empty store', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    const result = presentBio(subject, store)
    expect(result.entryNode.value).toBe(subject.value)
    expect(result.description).toBeUndefined()
  })

  it('mutation wraps updater errors with bio prefix', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    const plan = { create: [], update: [], remove: [] }
    await expect(processBioMutations(store, subject, plan as any)).rejects.toThrow(
      saveBioUpdatesFailedPrefixText
    )
  })
})
