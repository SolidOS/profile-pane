import { describe, expect, it } from "@jest/globals"
import { graph, literal, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { presentCV } from '../../src/sections/resume/selectors'
import { processResumeMutations } from '../../src/sections/resume/mutations'
import { mutationSaveResumeFailedPrefixText } from '../../src/texts'

describe('Resume selectors and mutations', () => {
  it('selector returns empty roles from empty store', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    expect(presentCV(subject, store)).toEqual([])
  })

  it('mutation wraps updater errors with resume prefix', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    const plan = { create: [], update: [], remove: [] }
    await expect(processResumeMutations(store, subject, plan as any)).rejects.toThrow(
      mutationSaveResumeFailedPrefixText
    )
  })

  it('creates resume membership and organization nodes with #id + 13 digits', async () => {
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
      create: [{
        title: 'Engineer',
        startDate: undefined,
        endDate: undefined,
        isCurrentRole: true,
        orgName: 'Acme Corp',
        orgType: 'Corporation',
        orgLocation: 'Remote',
        orgHomePage: 'https://acme.example',
        description: 'Build things',
        entryNode: '',
        status: 'new'
      }],
      update: [],
      remove: []
    }

    await processResumeMutations(store, subject, plan as any)

    const idPattern = /^https:\/\/example\.com\/profile\/card#id\d{13}$/
    const membershipNode = insertionsCaptured.find((statement) => statement.predicate.value === ns.org('member').value)?.subject

    expect(membershipNode?.value).toMatch(idPattern)

    const organizationNode = insertionsCaptured.find(
      (statement) => statement.subject.value === membershipNode.value && statement.predicate.value === ns.org('organization').value
    )?.object

    expect(organizationNode?.value).toMatch(idPattern)

    const organizationTypeValues = insertionsCaptured
      .filter((statement) =>
        statement.subject.value === organizationNode.value &&
        statement.predicate.value === ns.rdf('type').value
      )
      .map((statement) => statement.object.value)

    expect(organizationTypeValues).toContain(ns.vcard('Organization').value)
    expect(organizationTypeValues).toContain(ns.schema('Corporation').value)
    expect(insertionsCaptured.some((statement) =>
      statement.subject.value === organizationNode.value &&
      statement.predicate.value === ns.org('classification').value
    )).toBe(false)
  })

  it('writes solid role class type consistent with role timing', async () => {
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
      create: [
        {
          title: 'Current Role',
          startDate: literal('2024-01-01'),
          endDate: undefined,
          isCurrentRole: true,
          orgName: 'Now Inc',
          entryNode: '',
          status: 'new'
        },
        {
          title: 'Past Role',
          startDate: literal('2019-01-01'),
          endDate: literal('2020-01-01'),
          isCurrentRole: false,
          orgName: 'Old Inc',
          entryNode: '',
          status: 'new'
        },
        {
          title: 'Future Role',
          startDate: literal('2099-01-01'),
          endDate: undefined,
          isCurrentRole: false,
          orgName: 'Future Inc',
          entryNode: '',
          status: 'new'
        }
      ],
      update: [],
      remove: []
    }

    await processResumeMutations(store, subject, plan as any)

    const typeStatements = insertionsCaptured.filter(
      (statement) => statement.predicate.value === ns.rdf('type').value
    )
    const typeValues = typeStatements.map((statement) => statement.object.value)

    expect(typeValues).toContain(ns.solid('CurrentRole').value)
    expect(typeValues).toContain(ns.solid('PastRole').value)
    expect(typeValues).toContain(ns.solid('FutureRole').value)
  })

  it('selector derives orgType from membership role type when classification is missing', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()

    const membership = sym('https://example.com/profile/card#id123')
    const organization = sym('https://example.com/profile/card#id456')

    store.add(membership, ns.org('member'), subject, doc)
    store.add(membership, ns.rdf('type'), ns.solid('PastRole'), doc)
    store.add(membership, ns.vcard('role'), literal('Software Engineer'), doc)
    store.add(membership, ns.org('organization'), organization, doc)
    store.add(membership, ns.schema('startDate'), literal('2000-03-12'), doc)
    store.add(membership, ns.schema('endDate'), literal('2004-04-12'), doc)
    store.add(organization, ns.rdf('type'), ns.schema('Corporation'), doc)
    store.add(organization, ns.schema('name'), literal('Inrupt'), doc)

    const roles = presentCV(subject, store)
    expect(roles).toHaveLength(1)
    expect(roles[0].orgType).toBe('PastRole')
  })
})
