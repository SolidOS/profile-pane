import { graph, sym } from 'rdflib'
import { presentSocial } from '../../src/sections/social/selectors'
import { processSocialMutations } from '../../src/sections/social/mutations'
import { saveSocialUpdatesFailedPrefixText } from '../../src/texts'

jest.mock('../../src/sections/social/helpers', () => {
  const actual = jest.requireActual('../../src/sections/social/helpers')
  return {
    ...actual,
    ensureSocialOntologyLoaded: jest.fn()
  }
})

describe('Social selectors and mutations', () => {
  it('selector returns empty social accounts from empty store', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    expect(presentSocial(subject, store)).toEqual({ accounts: [] })
  })

  it('mutation wraps updater errors with social prefix', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    const plan = { create: [], update: [], remove: [] }
    await expect(processSocialMutations(store, subject, plan as any)).rejects.toThrow(
      saveSocialUpdatesFailedPrefixText
    )
  })
})
