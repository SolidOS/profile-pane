import { LiveStore, NamedNode } from "rdflib"
import { ns } from "solid-ui"

export interface EmailDetails {
  type: NamedNode,
  email: NamedNode
}

export interface PhoneDetails {
  type: NamedNode,
  phoneNumber: NamedNode
}

export interface AddressDetails {
  type?: NamedNode,
  fullAddress?: string,
  streetAddress?: string,
  locality?: string,
  region?: string,
  postalCode?: string,
  countryName?: string
}

export interface ContactDetails {
  emails: EmailDetails[],
  phones: PhoneDetails[],
  addresses: AddressDetails[]
}

function termValue(term: any): string {
  if (!term) return ''
  if (typeof term === 'string') return term
  return term.value || ''
}

function selectEmails(subject: NamedNode, store: LiveStore): EmailDetails[] {
  let emails: EmailDetails[] = []
  let type = null
  let email = null
  
  const emailNodes = store.each(subject, ns.vcard('hasEmail'), null, subject.doc()) || null
  emailNodes.map((node) => {
    email = store.any(node as NamedNode, ns.vcard('value'), null, subject.doc()) || node
    type = store.any(node as NamedNode, ns.rdf('type'), null, subject.doc())
    const emailValue = termValue(email)
    if (emailValue) {
      emails.push({ type, email })
    }
  })
  return emails
}

function selectPhones(subject: NamedNode, store: LiveStore): PhoneDetails[] {
  let phoneNumbers: PhoneDetails[] = []
  let type = null
  let phoneNumber = null

  const phoneNodes = store.each(subject, ns.vcard('hasTelephone'), null, subject.doc()) || null
  phoneNodes.map((node) => {
    phoneNumber = store.any(node as NamedNode, ns.vcard('value'), null, subject.doc()) || node
    type = store.any(node as NamedNode, ns.rdf('type'), null, subject.doc())
    const phoneValue = termValue(phoneNumber)
    if (phoneValue) {
      phoneNumbers.push({type, phoneNumber})
    }
  })
  return phoneNumbers
}

function selectAddresses(subject: NamedNode, store: LiveStore): AddressDetails[] {
  let addresses: AddressDetails[] = []
  let type = null
  let fullAddress = null
  let streetAddress = null
  let locality = null
  let region = null
  let postalCode = null
  let countryName = null

  const addressNodes = store.each(subject, ns.vcard('hasAddress'), null, subject.doc()) || null
  addressNodes.map((node) => {
    fullAddress = store.any(node as NamedNode, ns.vcard('value'), null, subject.doc())
    streetAddress = store.any(node as NamedNode, ns.vcard('street-address'), null, subject.doc())
    locality = store.any(node as NamedNode, ns.vcard('locality'), null, subject.doc())
    region = store.any(node as NamedNode, ns.vcard('region'), null, subject.doc())
    postalCode = store.any(node as NamedNode, ns.vcard('postal-code'), null, subject.doc())
    countryName = store.any(node as NamedNode, ns.vcard('country-name'), null, subject.doc())
    type = store.any(node as NamedNode, ns.rdf('type'), null, subject.doc())
    addresses.push({type, fullAddress, streetAddress, locality, region, postalCode, countryName})  
  })
  return addresses
}

export function selectContactDetails(subject: NamedNode, store: LiveStore): ContactDetails {
  const emails = selectEmails(subject, store)
  const phones = selectPhones(subject, store)
  const addresses = selectAddresses(subject, store)

  return { emails, phones, addresses }
}
