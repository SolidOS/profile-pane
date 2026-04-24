import { LiveStore, NamedNode, Literal, Node } from 'rdflib'
import { ns } from 'solid-ui'
import { RoleDetails } from './types'

const educationMembershipType = ns.schema('EducationalOccupationalCredential')
const vcardOrganizationType = ns.vcard('Organization').value
const schemaNamespace = 'http://schema.org/'

function localNameFromUri(uri: string): string {
  const value = (uri || '').trim()
  if (!value) return ''
  const fragmentMatch = value.match(/[#/]([^#/]+)$/)
  return fragmentMatch?.[1] || value
}

function nodeToDisplayText(store: LiveStore, node: Node | null | undefined, doc: NamedNode): string {
  if (!node) return ''
  if (node.termType === 'Literal') return node.value
  if (node.termType === 'NamedNode') {
    const label = store.anyJS(node as NamedNode, ns.rdfs('label'), null, doc) as string | null
    if (label) return label
    return localNameFromUri(node.value)
  }
  return ''
}

function roleTypeFromMembership(store: LiveStore, membership: NamedNode, doc: NamedNode): string {
  const roleTypes = store
    .each(membership, ns.rdf('type'), null, doc)
    .filter((node) => node.termType === 'NamedNode' && node.value.startsWith(ns.solid('').value))

  const matched = roleTypes.find((node) => {
    const local = localNameFromUri((node as NamedNode).value)
    return local === 'PastRole' || local === 'CurrentRole' || local === 'FutureRole'
  }) || roleTypes[0]

  return nodeToDisplayText(store, matched as Node | undefined, doc)
}

function organizationTypeFromNode(store: LiveStore, organization: NamedNode, doc: NamedNode): string {
  const classification = store.any(organization, ns.org('classification'), null, doc)
  const classificationText = nodeToDisplayText(store, classification as Node | null, doc)
  if (classificationText) return classificationText

  const organizationTypes = store
    .each(organization, ns.rdf('type'), null, doc)
    .filter((node) => node.termType === 'NamedNode')
    .filter((node) => (node as NamedNode).value !== vcardOrganizationType)

  const preferred = organizationTypes.find((node) => (node as NamedNode).value.startsWith(schemaNamespace)) || organizationTypes[0]
  return nodeToDisplayText(store, preferred as Node | undefined, doc)
}

function isEducationMembership(store: LiveStore, membership: Node, doc: NamedNode): boolean {
  return store.holds(membership as any, ns.rdf('type'), educationMembershipType, doc as any)
}
// Copied from CVPresenter and modified for new functionallity. 
/* Restructure for new design - notes */
/* The design displays in reverse chronological order: removed rolesByType and 
   just sort the Roles */
/* Data */
/* isCurrentRole: derive from no end date. Use to force behaviour of ui - enforcing an end date
    when not selected. */
/* Dates: change to Month Year format: Leave dates as startDate and endDate, populate
   these dates by using the 1st day of the month for the month that is selected.
   Compute at render time */
/* New Types: 
    Organization type: use org:classification note on vocab it's noted that 
    this is a somewhat unsettled type.
    Organization location: use org:location note: this is for a person's location inside
    an organization I'm thinking this is what we want here.
    Role description: use schema:description on the membership. Not sure if this is the best choice but what I could find.
*/
 
function getRoles(
  store: LiveStore,
  subject: NamedNode
): RoleDetails[] {
  const roles: RoleDetails[] = []
  const deduped = new Map<string, RoleDetails>()
  const doc = subject.doc()
  const memberships = store
    .each(null, ns.org('member'), subject, doc)
    .filter((membership) => !isEducationMembership(store, membership as Node, doc))

  for (const membership of memberships) {
    let orgHomePage, orgNameGiven, publicIdName, roleName, publicId, orgType, orgLocation
    // Things should have start dates but we will be very lenient in this view
    const startDate = store.any(membership as NamedNode, ns.schema('startDate'), null, doc) as Literal | null
    const endDate = store.any(membership as NamedNode, ns.schema('endDate'), null, doc) as Literal | null
    const roleDescription = store.anyJS(membership as NamedNode, ns.schema('description'), null, doc) as string | null
    const isCurrentRole = !endDate
    const roleType = roleTypeFromMembership(store, membership as NamedNode, doc)

    const organization = store.any(membership as NamedNode, ns.org('organization'), null, doc)
    if (organization) {
      orgNameGiven = store.anyJS(organization as NamedNode, ns.schema('name'), null, doc)
      orgHomePage = store.any(organization as NamedNode, ns.schema('uri'), null, doc)
      orgType = organizationTypeFromNode(store, organization as NamedNode, doc)
      orgLocation = store.any(organization as NamedNode, ns.org('location'), null, doc)
      publicId = store.any(organization as NamedNode, ns.solid('publicId'), null, doc)
    }
    if (publicId) {
      publicIdName = store.anyJS(publicId as NamedNode, ns.schema('name'), null, doc)
    }
    const orgName = publicIdName || orgNameGiven

    const escoRole = store.any(membership as NamedNode, ns.org('role'), null, doc)
    if (escoRole) {
      roleName = store.anyJS(escoRole as NamedNode, ns.schema('name'), null, doc) as string | null
    }
    const roleText0 = store.anyJS(membership as NamedNode, ns.vcard('role'), null, doc)
    const title = (roleText0 && roleName) ? roleName + ' - ' + roleText0
      : roleText0 || roleName

    const item: RoleDetails = {
      title,
      roleType,
      entryNode: membership as Node,
      startDate: startDate as Literal,
      endDate,
      isCurrentRole,
      orgName,
      orgType,
      orgLocation,
      orgHomePage,
      description: roleDescription || undefined
    }

    const dedupeKey = [
      item.title || '',
      item.orgName || '',
      item.startDate?.value || '',
      item.endDate?.value || ''
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

  deduped.forEach((item) => roles.push(item))
  return roles
}

function sortRoles(roles: RoleDetails[]): RoleDetails[] {
  return roles.sort((x, y) => {
    // Current roles first
    const xIsCurrent = !x.endDate
    const yIsCurrent = !y.endDate
    if (xIsCurrent !== yIsCurrent) return xIsCurrent ? -1 : 1

    const xEnd = x.endDate?.value || ''
    const yEnd = y.endDate?.value || ''
    if (xEnd !== yEnd) return yEnd.localeCompare(xEnd)

    const xStart = x.startDate?.value || ''
    const yStart = y.startDate?.value || ''
    return yStart.localeCompare(xStart)
  })
}

export function presentCV(
  subject: NamedNode,
  store: LiveStore
): RoleDetails[] {
  
 const roles = getRoles(store, subject)
 // Most recent thing most relevant -> sort by end date
 const sortedRoles = sortRoles(roles)

  return sortedRoles
}
