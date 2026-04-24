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

    const dateStatements = insertionsCaptured.filter(
      (statement) => statement.predicate.value === ns.schema('startDate').value || statement.predicate.value === ns.schema('endDate').value
    )
    expect(dateStatements.length).toBeGreaterThan(0)
    expect(dateStatements.every((statement) => statement.object.datatype?.value === ns.xsd('date').value)).toBe(true)
  })

  it('selector derives orgType from linked organization node type', () => {
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
    expect(roles[0].orgType).toBe('Corporation')
    expect(roles[0].roleType).toBe('PastRole')
  })

  it('does not write role classes as organization rdf:type', async () => {
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
        startDate: literal('2000-03-12'),
        endDate: literal('2004-04-12'),
        isCurrentRole: false,
        orgName: 'Inrupt',
        orgType: 'PastRole',
        entryNode: '',
        status: 'new'
      }],
      update: [],
      remove: []
    }

    await processResumeMutations(store, subject, plan as any)

    const organizationLink = insertionsCaptured.find(
      (statement) => statement.predicate.value === ns.org('organization').value
    )
    expect(organizationLink).toBeTruthy()

    const organizationTypeValues = insertionsCaptured
      .filter((statement) =>
        statement.subject.value === organizationLink.object.value &&
        statement.predicate.value === ns.rdf('type').value
      )
      .map((statement) => statement.object.value)

    expect(organizationTypeValues).toContain(ns.vcard('Organization').value)
    expect(organizationTypeValues).not.toContain(ns.schema('PastRole').value)
    expect(organizationTypeValues).not.toContain(ns.solid('PastRole').value)
  })

  it('uses explicit roleType when persisting membership type', async () => {
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
        title: 'Software Engineer',
        roleType: 'PastRole',
        startDate: literal('2099-01-01'),
        endDate: undefined,
        isCurrentRole: false,
        orgName: 'Inrupt',
        orgType: 'Corporation',
        entryNode: '',
        status: 'new'
      }],
      update: [],
      remove: []
    }

    await processResumeMutations(store, subject, plan as any)

    const membershipTypeValues = insertionsCaptured
      .filter((statement) => statement.predicate.value === ns.rdf('type').value)
      .map((statement) => statement.object.value)

    expect(membershipTypeValues).toContain(ns.solid('PastRole').value)
    expect(membershipTypeValues).not.toContain(ns.solid('FutureRole').value)
  })

  it('deleting a resume entry also deletes linked organization node statements', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()

    const membership = sym('https://example.com/profile/card#id1111111111111')
    const organization = sym('https://example.com/profile/card#id5523167668623')

    store.add(membership, ns.org('member'), subject, doc)
    store.add(membership, ns.rdf('type'), ns.solid('PastRole'), doc)
    store.add(membership, ns.org('organization'), organization, doc)
    store.add(organization, ns.rdf('type'), ns.vcard('Organization'), doc)
    store.add(organization, ns.rdf('type'), ns.schema('ResearchOrganization'), doc)
    store.add(organization, ns.schema('name'), literal('Google'), doc)
    store.add(organization, ns.org('location'), literal('San Diego'), doc)
    store.add(organization, ns.schema('uri'), literal('www.google.com'), doc)

    const capturedDeletions: any[] = []
    store.updater = {
      update: (deletions: any[], _insertions: any[], callback: Function) => {
        capturedDeletions.push(...deletions)
        callback('', true)
      }
    }

    const plan = {
      create: [],
      update: [],
      remove: [{
        title: 'Engineer',
        entryNode: membership.value,
        status: 'deleted'
      }]
    }

    await processResumeMutations(store, subject, plan as any)

    const deletionKeys = new Set(capturedDeletions.map((statement) => `${statement.subject.value} ${statement.predicate.value} ${statement.object.value}`))

    expect(deletionKeys.has(`${membership.value} ${ns.org('organization').value} ${organization.value}`)).toBe(true)
    expect(deletionKeys.has(`${organization.value} ${ns.schema('name').value} Google`)).toBe(true)
    expect(deletionKeys.has(`${organization.value} ${ns.org('location').value} San Diego`)).toBe(true)
  })
})
