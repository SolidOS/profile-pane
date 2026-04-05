import { describe, expect, it } from "@jest/globals"
import { graph, sym } from 'rdflib'
import { presentSkills } from '../../src/sections/skills/selectors'
import { processSkillsMutations } from '../../src/sections/skills/mutations'
import { mutationSaveSkillsFailedPrefixText } from '../../src/texts'

describe('Skills selectors and mutations', () => {
  it('selector returns empty skills from empty store', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    expect(presentSkills(subject, store)).toEqual([])
  })

  it('mutation wraps updater errors with skills prefix', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    const plan = { create: [], update: [], remove: [] }
    await expect(processSkillsMutations(store, subject, plan as any)).rejects.toThrow(
      mutationSaveSkillsFailedPrefixText
    )
  })
})
