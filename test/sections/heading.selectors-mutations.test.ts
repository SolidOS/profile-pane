import { describe, expect, it } from "@jest/globals"
import { graph, literal, st, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { presentProfile, pronounsAsText } from '../../src/sections/heading/selectors'
import { processHeadingMutations } from '../../src/sections/heading/mutations'
import { saveHeadingUpdatesFailedPrefixText } from '../../src/texts'

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

    await expect(processHeadingMutations(store, subject, plan as any)).rejects.toThrow(
      saveHeadingUpdatesFailedPrefixText
    )
  })

  it('prefers work email and phone when present', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()

    const homeEmail = sym('https://example.com/profile/card#email-home')
    const workEmail = sym('https://example.com/profile/card#email-work')
    const homePhone = sym('https://example.com/profile/card#phone-home')
    const workPhone = sym('https://example.com/profile/card#phone-work')

    store.add(st(subject, ns.vcard('hasEmail'), homeEmail, doc))
    store.add(st(homeEmail, ns.vcard('value'), sym('mailto:home@example.com'), doc))
    store.add(st(homeEmail, ns.rdf('type'), ns.vcard('Home'), doc))

    store.add(st(subject, ns.vcard('hasEmail'), workEmail, doc))
    store.add(st(workEmail, ns.vcard('value'), sym('mailto:work@example.com'), doc))
    store.add(st(workEmail, ns.rdf('type'), ns.vcard('Work'), doc))

    store.add(st(subject, ns.vcard('hasTelephone'), homePhone, doc))
    store.add(st(homePhone, ns.vcard('value'), sym('tel:+1111111111'), doc))
    store.add(st(homePhone, ns.rdf('type'), ns.vcard('Home'), doc))

    store.add(st(subject, ns.vcard('hasTelephone'), workPhone, doc))
    store.add(st(workPhone, ns.vcard('value'), sym('tel:+2222222222'), doc))
    store.add(st(workPhone, ns.rdf('type'), ns.vcard('Work'), doc))

    const profile = presentProfile(subject, store)

    expect(profile.primaryEmail?.entryNode.value).toBe(workEmail.value)
    expect(profile.primaryPhone?.entryNode.value).toBe(workPhone.value)
  })

  it('falls back to first valid email and phone when work type is missing', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()

    const firstEmail = sym('https://example.com/profile/card#email-first')
    const secondEmail = sym('https://example.com/profile/card#email-second')
    const firstPhone = sym('https://example.com/profile/card#phone-first')
    const secondPhone = sym('https://example.com/profile/card#phone-second')

    store.add(st(subject, ns.vcard('hasEmail'), firstEmail, doc))
    store.add(st(firstEmail, ns.vcard('value'), sym('mailto:first@example.com'), doc))
    store.add(st(firstEmail, ns.rdf('type'), ns.vcard('Home'), doc))

    store.add(st(subject, ns.vcard('hasEmail'), secondEmail, doc))
    store.add(st(secondEmail, ns.vcard('value'), sym('mailto:second@example.com'), doc))
    store.add(st(secondEmail, ns.rdf('type'), ns.vcard('Home'), doc))

    store.add(st(subject, ns.vcard('hasTelephone'), firstPhone, doc))
    store.add(st(firstPhone, ns.vcard('value'), sym('tel:+3333333333'), doc))
    store.add(st(firstPhone, ns.rdf('type'), ns.vcard('Home'), doc))

    store.add(st(subject, ns.vcard('hasTelephone'), secondPhone, doc))
    store.add(st(secondPhone, ns.vcard('value'), sym('tel:+4444444444'), doc))
    store.add(st(secondPhone, ns.rdf('type'), ns.vcard('Home'), doc))

    const profile = presentProfile(subject, store)

    expect(profile.primaryEmail?.entryNode.value).toBe(firstEmail.value)
    expect(profile.primaryPhone?.entryNode.value).toBe(firstPhone.value)
  })

  it('writes trimmed basic heading fields and keeps nicknames in sync', async () => {
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

    await processHeadingMutations(store, subject, {
      basicOps: {
        create: [{
          entryNode: subject.value,
          name: '  Jane Doe  ',
          nickname: '  janey  ',
          dateOfBirth: '2000-01-01',
          jobTitle: '  Engineer  ',
          orgName: '  Inrupt  ',
          imageSrc: 'https://example.com/jane.png',
          status: 'new'
        }],
        update: [],
        remove: []
      },
      phoneOps: { create: [], update: [], remove: [] },
      emailOps: { create: [], update: [], remove: [] },
      addressOps: { create: [], update: [], remove: [] }
    } as any)

    expect(store.any(subject, ns.vcard('fn'), null, doc)?.value).toBe('Jane Doe')
    expect(store.any(subject, ns.foaf('nick'), null, doc)?.value).toBe('janey')
    expect(store.any(subject, ns.vcard('nickname'), null, doc)?.value).toBe('janey')
    expect(store.any(subject, ns.vcard('role'), null, doc)?.value).toBe('Engineer')
    expect(store.any(subject, ns.vcard('organization-name'), null, doc)?.value).toBe('Inrupt')
    expect(store.any(subject, ns.vcard('hasPhoto'), null, doc)?.termType).toBe('NamedNode')

    await processHeadingMutations(store, subject, {
      basicOps: {
        create: [],
        update: [],
        remove: [{
          entryNode: subject.value,
          name: '',
          nickname: '',
          dateOfBirth: '',
          jobTitle: '',
          orgName: '',
          imageSrc: '',
          status: 'deleted'
        }]
      },
      phoneOps: { create: [], update: [], remove: [] },
      emailOps: { create: [], update: [], remove: [] },
      addressOps: { create: [], update: [], remove: [] }
    } as any)

    expect(store.any(subject, ns.vcard('fn'), null, doc)).toBeNull()
    expect(store.any(subject, ns.foaf('nick'), null, doc)).toBeNull()
    expect(store.any(subject, ns.vcard('hasPhoto'), null, doc)).toBeNull()
  })
})
