import { graph, sym } from 'rdflib'
import { presentProjects } from '../../src/sections/projects/selectors'
import { processProjectsMutations } from '../../src/sections/projects/mutations'

describe('Projects selectors and mutations', () => {
  it('selector returns empty projects from empty store', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    expect(presentProjects(subject, store)).toEqual([])
  })

  it('mutation wraps updater errors with projects prefix', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    const plan = { create: [], update: [], remove: [] }
    await expect(processProjectsMutations(store, subject, plan as any)).rejects.toThrow('Failed to save projects:')
  })
})
