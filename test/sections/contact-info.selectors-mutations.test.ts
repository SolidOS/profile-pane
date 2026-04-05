import { describe, expect, it } from "@jest/globals"
import { graph, sym } from 'rdflib'
import { presentContactInfo } from '../../src/sections/contactInfo/selectors'
import { processContactInfoMutations } from '../../src/sections/contactInfo/mutations'
import { mutationSaveContactInfoFailedPrefixText } from '../../src/texts'

describe('Contact info selectors and mutations', () => {
  it('selector returns empty contact arrays from empty store', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    const result = presentContactInfo(subject, store)
    expect(result.emails).toEqual([])
    expect(result.phones).toEqual([])
    expect(result.addresses).toEqual([])
  })

  it('mutation wraps updater errors with contact prefix', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    const plan = {
      phoneOps: { create: [], update: [], remove: [] },
      emailOps: { create: [], update: [], remove: [] },
      addressOps: { create: [], update: [], remove: [] }
    }

    await expect(processContactInfoMutations(store, subject, plan as any)).rejects.toThrow(
      mutationSaveContactInfoFailedPrefixText
    )
  })
})
