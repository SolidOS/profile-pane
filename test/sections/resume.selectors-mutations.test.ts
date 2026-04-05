import { graph, sym } from 'rdflib'
import { presentCV } from '../../src/sections/resume/selectors'
import { processResumeMutations } from '../../src/sections/resume/mutations'
import { mutationSaveResumeFailedPrefixText } from '../../src/texts'

describe('Resume selectors and mutations', () => {
  it('selector returns empty roles from empty store', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    expect(presentCV(subject, store)).toEqual([])
  })

  it('mutation wraps updater errors with resume prefix', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    const plan = { create: [], update: [], remove: [] }
    await expect(processResumeMutations(store, subject, plan as any)).rejects.toThrow(
      mutationSaveResumeFailedPrefixText
    )
  })
})
