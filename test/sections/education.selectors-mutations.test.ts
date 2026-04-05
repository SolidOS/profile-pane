import { graph, sym } from 'rdflib'
import { presentEducation } from '../../src/sections/education/selectors'
import { processEducationMutations } from '../../src/sections/education/mutations'
import { mutationEducationFailedPrefixText } from '../../src/texts'

describe('Education selectors and mutations', () => {
  it('selector returns empty education list from empty store', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    expect(presentEducation(subject, store)).toEqual([])
  })

  it('mutation wraps updater errors with education prefix', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    const plan = { create: [], update: [], remove: [] }
    await expect(processEducationMutations(store, subject, plan as any)).rejects.toThrow(
      mutationEducationFailedPrefixText
    )
  })
})
