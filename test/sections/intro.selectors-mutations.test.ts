import { describe, expect, it } from "@jest/globals"
import { graph, sym } from 'rdflib'
import { presentProfile, pronounsAsText } from '../../src/sections/intro/selectors'
import { processIntroMutations } from '../../src/sections/intro/mutations'
import { saveIntroUpdatesFailedPrefixText } from '../../src/texts'

describe('Intro selectors and mutations', () => {
  it('selectors return a stable profile shape from empty store', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    expect(pronounsAsText(store, subject)).toBe('')

    const profile = presentProfile(subject, store)
    expect(profile.entryNode.value).toBe(subject.value)
    expect(typeof profile.name).toBe('string')
  })

  it('mutation wraps low-level updater errors', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    const plan = {
      basicOps: { create: [], update: [], remove: [] },
      phoneOps: { create: [], update: [], remove: [] },
      emailOps: { create: [], update: [], remove: [] },
      addressOps: { create: [], update: [], remove: [] }
    }

    await expect(processIntroMutations(store, subject, plan as any)).rejects.toThrow(
      saveIntroUpdatesFailedPrefixText
    )
  })
})
