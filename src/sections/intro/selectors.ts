
/* Copied from presenter and modified for new functionallity */
import { NamedNode, Node, LiveStore } from 'rdflib'
import { utils, ns, widgets } from 'solid-ui'
import type { AddressDetails, PointDetails } from '../contactInfo/types'
import type { ProfileDetails } from './types'


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
  const nickname = store.anyValue(subject, ns.vcard("nickname")) || store.anyValue(subject, ns.foaf("nick")) || undefined
  const dateOfBirth = store.anyValue(subject, ns.vcard('bday')) || undefined
  const imageSrc = widgets.findImage(subject)
  const jobTitle = store.anyValue(subject, ns.vcard('role')) || undefined
  const orgName = store.anyValue(subject, ns.vcard('organization-name')) || undefined // @@ Search whole store

  // Contact info - we will only show one of each type here
  // Just doing for now, but we should change to either store a primary
  // indicator or store it a bit differently in the store.
  const primaryPhoneEntryNode = store.any(subject, ns.vcard('hasTelephone')) as Node || undefined
  const primaryPhoneValueNode = primaryPhoneEntryNode
    ? (store.any(primaryPhoneEntryNode as NamedNode, ns.vcard('value')) as Node || primaryPhoneEntryNode)
    : undefined
  const primaryPhoneType = primaryPhoneEntryNode
    ? (store.any(primaryPhoneEntryNode as NamedNode, ns.rdf('type')) as Node || undefined)
    : undefined
  const primaryPhone: PointDetails | undefined = (primaryPhoneEntryNode && primaryPhoneValueNode)
    ? {
      entryNode: primaryPhoneEntryNode,
      type: primaryPhoneType || ns.vcard('Voice'),
      valueNode: primaryPhoneValueNode
    }
    : undefined

  const primaryEmailEntryNode = store.any(subject, ns.vcard('hasEmail')) as Node || undefined
  const primaryEmailValueNode = primaryEmailEntryNode
    ? (store.any(primaryEmailEntryNode as NamedNode, ns.vcard('value')) as Node || primaryEmailEntryNode)
    : undefined
  const primaryEmailType = primaryEmailEntryNode
    ? (store.any(primaryEmailEntryNode as NamedNode, ns.rdf('type')) as Node || undefined)
    : undefined
  const primaryEmail: PointDetails | undefined = (primaryEmailEntryNode && primaryEmailValueNode)
    ? {
      entryNode: primaryEmailEntryNode,
      type: primaryEmailType || ns.vcard('Internet'),
      valueNode: primaryEmailValueNode
    }
    : undefined

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
