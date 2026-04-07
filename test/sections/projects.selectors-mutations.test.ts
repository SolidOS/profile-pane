import { describe, expect, it } from "@jest/globals"
import { graph, st, sym } from 'rdflib'
import { ns } from 'solid-ui'
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

  it('selector reads projects from solid:community links', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()

    store.add(subject, ns.solid('community'), sym('https://example.org/community'), doc)

    const projects = presentProjects(subject, store)
    expect(projects).toHaveLength(1)
    expect(projects[0].url).toBe('https://example.org/community')
  })

  it('mutation stores only solid:community links', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()

    store.updater = {
      update: (deletions: any[], insertions: any[], callback: Function) => {
        deletions.forEach((statement) => store.remove(st(statement.subject, statement.predicate, statement.object, statement.why)))
        insertions.forEach((statement) => store.add(statement.subject, statement.predicate, statement.object, statement.why))
        callback('', true)
      }
    }

    const plan = {
      create: [{ url: 'https://example.org/project-a', entryNode: '', status: 'new' }],
      update: [],
      remove: []
    }

    await processProjectsMutations(store, subject, plan as any)

    const links = store.statementsMatching(subject, ns.solid('community'), null, doc)
    expect(links).toHaveLength(1)
    expect(links[0].object.value).toBe('https://example.org/project-a')
    expect(store.statementsMatching(subject, ns.schema('memberOf'), null, doc)).toHaveLength(0)
  })
})
