import { presentProfile } from '../src/sections/heading/selectors'
import { blankNode, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { store } from 'solid-logic'

describe('presenter', () => {
  const jane = sym('https://jane.doe.example/profile/card#me')
  const doc = jane.doc()

  beforeEach(() => {
    store.removeDocument(doc)
  })

  it('presents minimum available info', () => {
    const result = presentProfile(jane, store)
    expect(result.name).toBe('jane.doe.example')
    expect(result.imageSrc).toBeNull()
    expect(result.jobTitle).toBeUndefined()
    expect(result.orgName).toBeUndefined()
    expect(result.location).toBeNull()
  })

  it('presents a name', () => {
    store.add(jane, ns.foaf('name'), 'Jane Doe', doc)
    const result = presentProfile(jane, store)
    expect(result.name).toBe('Jane Doe')
  })

  it('presents an image', () => {
    store.add(
      jane,
      ns.foaf('img'),
      sym('https://jane.doe.example/profile/me.jpg'),
      doc
    )
    const result = presentProfile(jane, store)
    expect(result.imageSrc).toBe('https://jane.doe.example/profile/me.jpg')
  })

  it('presents role in jobTitle', () => {
    store.add(jane, ns.vcard('role'), 'Test Double', doc)
    const result = presentProfile(jane, store)
    expect(result.jobTitle).toBe('Test Double')
  })

  it('presents organization name in orgName', () => {
    store.add(jane, ns.vcard('organization-name'), 'Solid Community', doc)
    const result = presentProfile(jane, store)
    expect(result.orgName).toBe('Solid Community')
  })

  it('presents both role and organization name independently', () => {
    store.add(jane, ns.vcard('role'), 'Test Double', doc)
    store.add(jane, ns.vcard('organization-name'), 'Solid Community', doc)
    const result = presentProfile(jane, store)
    expect(result.jobTitle).toBe('Test Double')
    expect(result.orgName).toBe('Solid Community')
  })

  it('presents country in location', () => {
    const address = blankNode()
    store.add(jane, ns.vcard('hasAddress'), address, doc)
    store.add(address, ns.vcard('country-name'), 'Germany', doc)
    const result = presentProfile(jane, store)
    expect(result.location).toBe('Germany')
  })

  it('presents locality in location', () => {
    const address = blankNode()
    store.add(jane, ns.vcard('hasAddress'), address, doc)
    store.add(address, ns.vcard('locality'), 'Hamburg', doc)
    const result = presentProfile(jane, store)
    expect(result.location).toBe('Hamburg')
  })

  it('presents both locality and country name in location', () => {
    const address = blankNode()
    store.add(jane, ns.vcard('hasAddress'), address, doc)
    store.add(address, ns.vcard('locality'), 'Hamburg', doc)
    store.add(address, ns.vcard('country-name'), 'Germany', doc)
    const result = presentProfile(jane, store)
    expect(result.location).toBe('Hamburg, Germany')
  })

  it('presents preferred Pronouns', () => {
    store.add(jane, ns.solid('preferredSubjectPronoun'), 'they', doc)
    store.add(jane, ns.solid('preferredObjectPronoun'), 'them', doc)
    store.add(jane, ns.solid('preferredRelativePronoun'), 'their', doc)
    const result = presentProfile(jane, store)
    expect(result.pronouns).toBe('they/them')
  })
  
})
