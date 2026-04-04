import { LiveStore, NamedNode, Node } from 'rdflib'
import { ns } from 'solid-ui'
import { EducationDetails } from './types'

const educationMembershipType = ns.schema('EducationalOccupationalCredential')

function isEducationMembership(store: LiveStore, membership: Node, doc: NamedNode): boolean {
  return store.holds(membership as any, ns.rdf('type'), educationMembershipType, doc as any)
}

function getEducation(store: LiveStore, subject: NamedNode): EducationDetails[] {
  const education: EducationDetails[] = []
  const deduped = new Map<string, EducationDetails>()
  const doc = subject.doc()
  const memberships = store
    .each(null, ns.org('member'), subject, doc)
    .filter((membership) => isEducationMembership(store, membership as Node, doc))

  for (const membership of memberships) {
    const school = (store.anyJS(membership as NamedNode, ns.schema('name'), null, doc) as string | null) || ''
    const degree = (store.anyJS(membership as NamedNode, ns.schema('educationalCredentialAwarded'), null, doc) as string | null) || undefined
    const location = (store.anyJS(membership as NamedNode, ns.schema('location'), null, doc) as string | null) || undefined
    const startDate = (store.anyJS(membership as NamedNode, ns.schema('startDate'), null, doc) as string | null) || undefined
    const endDate = (store.anyJS(membership as NamedNode, ns.schema('endDate'), null, doc) as string | null) || undefined
    const description = (store.anyJS(membership as NamedNode, ns.schema('description'), null, doc) as string | null) || undefined

    const item: EducationDetails = {
      school,
      degree,
      location,
      startDate,
      endDate,
      description,
      entryNode: membership as Node
    }

    const dedupeKey = [
      item.school || '',
      item.degree || '',
      item.location || '',
      item.startDate || '',
      item.endDate || ''
    ].join('|')

    const existing = deduped.get(dedupeKey)
    if (!existing) {
      deduped.set(dedupeKey, item)
      continue
    }

    const existingIsNamed = (existing.entryNode as any).termType === 'NamedNode'
    const nextIsNamed = (item.entryNode as any).termType === 'NamedNode'
    if (!existingIsNamed && nextIsNamed) {
      deduped.set(dedupeKey, item)
    }
  }

  deduped.forEach((item) => education.push(item))
  return education
}

function sortEducation(education: EducationDetails[]): EducationDetails[] {
  return education.sort((x, y) => {
    const xIsCurrent = !x.endDate
    const yIsCurrent = !y.endDate
    if (xIsCurrent !== yIsCurrent) return xIsCurrent ? -1 : 1

    const xEnd = x.endDate || ''
    const yEnd = y.endDate || ''
    if (xEnd !== yEnd) return yEnd.localeCompare(xEnd)

    const xStart = x.startDate || ''
    const yStart = y.startDate || ''
    return yStart.localeCompare(xStart)
  })
}

export function presentEducation(subject: NamedNode, store: LiveStore): EducationDetails[] {
  const education = getEducation(store, subject)
  return sortEducation(education)
}
