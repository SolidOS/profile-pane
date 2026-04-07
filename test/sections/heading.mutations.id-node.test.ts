import { describe, expect, it } from '@jest/globals'
import { graph, sym, literal } from 'rdflib'
import { ns } from 'solid-ui'
import { cleanupHeadingLanguagesAndOrphans, processHeadingMutations } from '../../src/sections/heading/mutations'

describe('Heading mutations id-node writes', () => {
  it('creates phone/email/address entries with #id + 13 digits and URI values', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const insertionsCaptured: any[] = []

    store.updater = {
      update: (_deletions: any[], insertions: any[], callback: Function) => {
        insertionsCaptured.push(...insertions)
        callback('', true)
      }
    }

    const plan = {
      basicOps: { create: [], update: [], remove: [] },
      phoneOps: {
        create: [{ value: '+1-999-888-7777', type: 'Voice', entryNode: '', status: 'new' }],
        update: [],
        remove: []
      },
      emailOps: {
        create: [{ value: 'alex@example.com', type: 'Internet', entryNode: '', status: 'new' }],
        update: [],
        remove: []
      },
      addressOps: {
        create: [{ streetAddress: 'North St', locality: 'NYC', region: 'NY', postalCode: '10001', countryName: 'US', type: 'Home', entryNode: '', status: 'new' }],
        update: [],
        remove: []
      }
    }

    await processHeadingMutations(store, subject, plan as any)

    const idPattern = /^https:\/\/example\.com\/profile\/card#id\d{13}$/

    const emailLink = insertionsCaptured.find((statement) => statement.predicate.value === ns.vcard('hasEmail').value)
    const phoneLink = insertionsCaptured.find((statement) => statement.predicate.value === ns.vcard('hasTelephone').value)
    const addressLink = insertionsCaptured.find((statement) => statement.predicate.value === ns.vcard('hasAddress').value)

    expect(emailLink?.object?.value).toMatch(idPattern)
    expect(phoneLink?.object?.value).toMatch(idPattern)
    expect(addressLink?.object?.value).toMatch(idPattern)

    const emailValue = insertionsCaptured.find(
      (statement) => statement.subject.value === emailLink.object.value && statement.predicate.value === ns.vcard('value').value
    )
    const phoneValue = insertionsCaptured.find(
      (statement) => statement.subject.value === phoneLink.object.value && statement.predicate.value === ns.vcard('value').value
    )

    expect(emailValue?.object?.termType).toBe('NamedNode')
    expect(emailValue?.object?.value).toBe('mailto:alex@example.com')
    expect(phoneValue?.object?.termType).toBe('NamedNode')
    expect(phoneValue?.object?.value).toBe('tel:+1-999-888-7777')
  })

  it('cleans knowsLanguage graph and orphan local nodes', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()

    const languageList = store.bnode('langList')
    const languageEntry = sym('https://example.com/profile/card#id1111111111111')
    const languagePublicId = sym('https://example.com/profile/card#id2222222222222')
    const orphanNode = sym('https://example.com/profile/card#id3333333333333')
    const linkedEmail = sym('https://example.com/profile/card#id4444444444444')

    store.add(subject, ns.schema('knowsLanguage'), languageList, doc)
    store.add(languageList, ns.rdf('first'), languageEntry, doc)
    store.add(languageList, ns.rdf('rest'), ns.rdf('nil'), doc)
    store.add(languageEntry, ns.solid('publicId'), languagePublicId, doc)
    store.add(languagePublicId, ns.schema('name'), literal('Arabic'), doc)
    store.add(languagePublicId, ns.rdf('type'), ns.schema('Language'), doc)

    store.add(orphanNode, ns.schema('name'), literal('Orphan'), doc)

    store.add(subject, ns.vcard('hasEmail'), linkedEmail, doc)
    store.add(linkedEmail, ns.vcard('value'), sym('mailto:alex@example.com'), doc)

    const capturedDeletions: any[] = []
    const capturedInsertions: any[] = []
    store.updater = {
      update: (deletions: any[], insertions: any[], callback: Function) => {
        capturedDeletions.push(...deletions)
        capturedInsertions.push(...insertions)
        callback('', true)
      }
    }

    const summary = await cleanupHeadingLanguagesAndOrphans(store, subject)

    expect(summary.removedKnowsLanguageLinks).toBe(1)
    expect(summary.removedOrphanNodes).toBe(1)
    expect(summary.deletedStatements).toBeGreaterThanOrEqual(7)
    expect(capturedInsertions).toHaveLength(0)

    const deletionKeys = new Set(capturedDeletions.map((statement) => `${statement.subject.value} ${statement.predicate.value} ${statement.object.value}`))

    expect(deletionKeys.has(`${subject.value} ${ns.schema('knowsLanguage').value} ${languageList.value}`)).toBe(true)
    expect(deletionKeys.has(`${orphanNode.value} ${ns.schema('name').value} Orphan`)).toBe(true)
    expect(deletionKeys.has(`${subject.value} ${ns.vcard('hasEmail').value} ${linkedEmail.value}`)).toBe(false)
  })
})
