import { describe, expect, it, jest } from "@jest/globals"
import { graph, st, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { presentSocial } from '../../src/sections/social/selectors'
import { processSocialMutations } from '../../src/sections/social/mutations'
import { saveSocialUpdatesFailedPrefixText } from '../../src/texts'
import { expandRdfList } from '../../src/sections/shared/rdfList'

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

  it('writes new social entry as id node with foaf account structure', async () => {
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
      create: [{ name: 'Github', icon: '', homepage: 'https://www.github.com/sharon', entryNode: '', status: 'new' }],
      update: [],
      remove: []
    }

    await processSocialMutations(store, subject, plan as any)

    const accountLinks = store.statementsMatching(subject, ns.foaf('account'), null, doc)
    expect(accountLinks).toHaveLength(1)

    const expandedAccounts = accountLinks
      .flatMap((statement: any) => expandRdfList(store, statement.object))
      .filter((node: any) => node.termType === 'NamedNode')
    expect(expandedAccounts).toHaveLength(1)
    const entryNode = expandedAccounts[0]
    expect(entryNode.termType).toBe('NamedNode')
    expect(entryNode.value).toMatch(/^https:\/\/example\.com\/profile\/card#id\d{13}$/)

    const accountName = store.any(entryNode, ns.foaf('accountName'), null, doc)
    expect(accountName?.value).toBe('sharon')
  })
})
