import { describe, expect, it } from "@jest/globals"
import { graph, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { presentContactInfo } from '../../src/sections/contactInfo/selectors'
import { processContactInfoMutations } from '../../src/sections/contactInfo/mutations'
import { mutationSaveContactInfoFailedPrefixText } from '../../src/texts'

describe('Contact info selectors and mutations', () => {
  it('selector returns empty contact arrays from empty store', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    const result = presentContactInfo(subject, store)
    expect(result.emails).toEqual([])
    expect(result.phones).toEqual([])
    expect(result.addresses).toEqual([])
  })

  it('mutation wraps updater errors with contact prefix', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    const plan = {
      phoneOps: { create: [], update: [], remove: [] },
      emailOps: { create: [], update: [], remove: [] },
      addressOps: { create: [], update: [], remove: [] }
    }

    await expect(processContactInfoMutations(store, subject, plan as any)).rejects.toThrow(
      mutationSaveContactInfoFailedPrefixText
    )
  })

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
      phoneOps: {
        create: [{ value: '+1-111-222-3333', type: 'Voice', entryNode: '', status: 'new' }],
        update: [],
        remove: []
      },
      emailOps: {
        create: [{ value: 'jane@example.com', type: 'Internet', entryNode: '', status: 'new' }],
        update: [],
        remove: []
      },
      addressOps: {
        create: [{ streetAddress: 'Main St', locality: 'Boston', region: 'MA', postalCode: '02101', countryName: 'US', type: 'Home', entryNode: '', status: 'new' }],
        update: [],
        remove: []
      }
    }

    await processContactInfoMutations(store, subject, plan as any)

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
    expect(emailValue?.object?.value).toBe('mailto:jane@example.com')
    expect(phoneValue?.object?.termType).toBe('NamedNode')
    expect(phoneValue?.object?.value).toBe('tel:+1-111-222-3333')
  })
})
