import { describe, expect, it } from "@jest/globals"
import { graph, literal, st, sym } from 'rdflib'
import { ns } from 'solid-ui'
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

  it('selector reads the stored bio note', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()

    store.add(st(subject, ns.vcard('note'), literal('Building accessible Solid apps.'), doc))

    const result = presentBio(subject, store)
    expect(result.description).toBe('Building accessible Solid apps.')
  })

  it('mutation writes and removes the vcard:note literal', async () => {
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

    await processBioMutations(store, subject, {
      create: [{ entryNode: subject.value, description: '  New bio text  ', status: 'new' }],
      update: [],
      remove: []
    } as any)

    expect(store.any(subject, ns.vcard('note'), null, doc)?.value).toBe('New bio text')

    await processBioMutations(store, subject, {
      create: [],
      update: [],
      remove: [{ entryNode: subject.value, description: '', status: 'deleted' }]
    } as any)

    expect(store.any(subject, ns.vcard('note'), null, doc)).toBeNull()
  })
})
