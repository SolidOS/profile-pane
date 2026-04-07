
/* Copied from presenter and modified for new functionallity */
import { NamedNode, Node, LiveStore } from 'rdflib'
import { utils, ns, widgets } from 'solid-ui'
import type { AddressDetails, PointDetails } from '../contactInfo/types'
import type { ProfileDetails } from './types'

function termValue(term: unknown): string {
  if (!term) return ''
  if (typeof term === 'string') return term
  if (typeof term === 'object' && 'value' in (term as Record<string, unknown>)) {
    const value = (term as { value?: unknown }).value
    return typeof value === 'string' ? value : ''
  }
  return ''
}

function isEmailValue(value: string): boolean {
  const normalized = (value || '').trim()
  if (!normalized) return false
  if (/^mailto:/i.test(normalized)) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
}

function isPhoneValue(value: string): boolean {
  const normalized = (value || '').trim()
  if (!normalized) return false
  if (/^tel:/i.test(normalized)) return true
  return /^[+()\-\s\d]{5,}$/.test(normalized)
}

function resolvePointValueNode(
  store: LiveStore,
  entryNode: Node | undefined,
  doc: NamedNode,
  kind: 'email' | 'phone'
): Node | undefined {
  if (!entryNode) return undefined

  const expected = kind === 'email' ? isEmailValue : isPhoneValue

  const entryValue = termValue(entryNode)
  if (expected(entryValue)) return entryNode

  if ((entryNode as { termType?: string }).termType !== 'NamedNode') return undefined
  const inDocStatements = store.statementsMatching(entryNode as NamedNode, ns.vcard('value'), null, doc)
  const anyGraphStatements = store.statementsMatching(entryNode as NamedNode, ns.vcard('value'))

  for (const statement of [...inDocStatements, ...anyGraphStatements]) {
    if (expected(termValue(statement.object))) {
      return statement.object as Node
    }
  }

  return undefined
}

function resolvePointType(store: LiveStore, entryNode: Node, doc: NamedNode): Node | undefined {
  if ((entryNode as { termType?: string }).termType !== 'NamedNode') return undefined
  const inDocStatements = store.statementsMatching(entryNode as NamedNode, ns.rdf('type'), null, doc)
  if (inDocStatements.length > 0) return inDocStatements[0].object as Node

  const anyGraphStatements = store.statementsMatching(entryNode as NamedNode, ns.rdf('type'))
  if (anyGraphStatements.length > 0) return anyGraphStatements[0].object as Node

  return undefined
}

function selectPrimaryPoint(
  store: LiveStore,
  subject: NamedNode,
  predicate: NamedNode,
  doc: NamedNode,
  kind: 'email' | 'phone',
  fallbackType: Node
): PointDetails | undefined {
  const inDocStatements = store.statementsMatching(subject, predicate, null, doc)
  const anyGraphStatements = store.statementsMatching(subject, predicate)
  const nodes = [...inDocStatements, ...anyGraphStatements].map((statement) => statement.object as Node)

  const seen = new Set<string>()
  for (const entryNode of nodes) {
    const key = termValue(entryNode)
    if (key && seen.has(key)) continue
    if (key) seen.add(key)

    const valueNode = resolvePointValueNode(store, entryNode, doc, kind)
    if (!valueNode) continue

    const type = resolvePointType(store, entryNode, doc) || fallbackType
    return { entryNode, type, valueNode }
  }

  return undefined
}


export function pronounsAsText (store: LiveStore, subject:NamedNode): string {
  let pronouns = store.anyJS(subject, ns.solid('preferredSubjectPronoun')) || ''
  if (pronouns) {
    const them = store.anyJS(subject, ns.solid('preferredObjectPronoun'))
    if (them) {
      pronouns += '/' + them
    }
  }
  return pronouns || ''
}

function formatLocation(countryName: string | void, locality: string | void) {
  return countryName && locality
    ? `${locality}, ${countryName}`
    : countryName || locality || null
}

export const presentProfile = (
  subject: NamedNode,
  store: LiveStore
): ProfileDetails => {
  const name = utils.label(subject)
  // on contact-pane form it is foaf, but maybe another app saves with vcard.
  const nickname = store.anyValue(subject, ns.vcard('nickname')) || store.anyValue(subject, ns.foaf('nick')) || undefined
  const dateOfBirth = store.anyValue(subject, ns.vcard('bday')) || undefined
  const imageSrc = widgets.findImage(subject)
  const jobTitle = store.anyValue(subject, ns.vcard('role')) || undefined
  const orgName = store.anyValue(subject, ns.vcard('organization-name')) || undefined // @@ Search whole store
  const doc = subject.doc()

  // Contact info - we will only show one of each type here
  // Just doing for now, but we should change to either store a primary
  // indicator or store it a bit differently in the store.
  const primaryPhone = selectPrimaryPoint(store, subject, ns.vcard('hasTelephone'), doc, 'phone', ns.vcard('Voice'))

  const primaryEmail = selectPrimaryPoint(store, subject, ns.vcard('hasEmail'), doc, 'email', ns.vcard('Internet'))

  const primaryAddressEntryNode = store.any(subject, ns.vcard('hasAddress')) as Node || undefined
  const primaryAddressType = primaryAddressEntryNode
    ? (store.any(primaryAddressEntryNode as NamedNode, ns.rdf('type')) as Node || undefined)
    : undefined
  const primaryStreetAddress = primaryAddressEntryNode
    ? (store.anyValue(primaryAddressEntryNode as NamedNode, ns.vcard('street-address')) || undefined)
    : undefined
  const primaryLocality = primaryAddressEntryNode
    ? (store.anyValue(primaryAddressEntryNode as NamedNode, ns.vcard('locality')) || undefined)
    : undefined
  const primaryRegion = primaryAddressEntryNode
    ? (store.anyValue(primaryAddressEntryNode as NamedNode, ns.vcard('region')) || undefined)
    : undefined
  const primaryPostalCode = primaryAddressEntryNode
    ? (store.anyValue(primaryAddressEntryNode as NamedNode, ns.vcard('postal-code')) || undefined)
    : undefined
  const primaryCountryName = primaryAddressEntryNode
    ? (store.anyValue(primaryAddressEntryNode as NamedNode, ns.vcard('country-name')) || undefined)
    : undefined
  const primaryAddress: AddressDetails | undefined = primaryAddressEntryNode
    ? {
      entryNode: primaryAddressEntryNode,
      type: primaryAddressType,
      streetAddress: primaryStreetAddress,
      locality: primaryLocality,
      region: primaryRegion,
      postalCode: primaryPostalCode,
      countryName: primaryCountryName
    }
    : undefined

  const address: Node | null = primaryAddressEntryNode || null
  const countryName =
    address != null
      ? store.anyValue(address as NamedNode, ns.vcard('country-name'))
      : null
  const locality =
    address != null
      ? store.anyValue(address as NamedNode, ns.vcard('locality'))
      : null

      
  const pronouns = pronounsAsText(store, subject)

  return {
    name,
    nickname,
    imageSrc,
    dateOfBirth,
    jobTitle,
    orgName,
    primaryPhone,
    primaryEmail,
    primaryAddress,
    location: formatLocation(countryName, locality),
    pronouns,
    entryNode: subject
  }
}
