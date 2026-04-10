import { describe, expect, it, jest } from "@jest/globals"
import { graph, literal, st, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { presentSocial } from '../../src/sections/social/selectors'
import { processSocialMutations } from '../../src/sections/social/mutations'
import { findSocialAccountOption, getSocialAccountOptions, homepageForAccount } from '../../src/sections/social/helpers'
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
  it('provides social account options including Facebook and Instagram', () => {
    const store = graph() as any

    const options = getSocialAccountOptions(store)
    const labels = options.map((option) => option.label.toLowerCase())

    expect(labels).toContain('facebook')
    expect(labels).toContain('instagram')
  })

  it('matches account options from legacy account-like names', () => {
    const store = graph() as any
    const options = getSocialAccountOptions(store)

    expect(findSocialAccountOption(options, 'FacebookAccount')?.label).toBe('Facebook')
    expect(findSocialAccountOption(options, 'InstagramAccount')?.label).toBe('Instagram')
  })

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

  it('normalizes duplicated profile prefix when writing accountName', async () => {
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
      create: [{
        name: 'Facebook',
        icon: '',
        homepage: 'https://www.facebook.com/https://www.facebook.com/sharon.stratsianis',
        entryNode: '',
        status: 'new'
      }],
      update: [],
      remove: []
    }

    await processSocialMutations(store, subject, plan as any)

    const accountLinks = store.statementsMatching(subject, ns.foaf('account'), null, doc)
    const expandedAccounts = accountLinks
      .flatMap((statement: any) => expandRdfList(store, statement.object))
      .filter((node: any) => node.termType === 'NamedNode')
    const entryNode = expandedAccounts[0]

    const accountName = store.any(entryNode, ns.foaf('accountName'), null, doc)
    expect(accountName?.value).toBe('sharon.stratsianis')
  })

  it('uses full accountName URL as homepage without re-prefixing', () => {
    const store = graph() as any
    const accountNode = sym('https://example.com/profile/card#id1')
    const classNode = sym('https://solidos.github.io/profile-pane/src/ontology/socialMedia.ttl#FacebookAccount')
    const doc = accountNode.doc()

    store.add(accountNode, ns.rdf('type'), classNode, doc)
    store.add(classNode, ns.foaf('userProfilePrefix'), literal('https://www.facebook.com/') as any, doc)
    store.add(accountNode, ns.foaf('accountName'), literal('https://www.facebook.com/sharon.stratsianis') as any, doc)

    expect(homepageForAccount(store, accountNode)).toBe('https://www.facebook.com/sharon.stratsianis')
  })
})
