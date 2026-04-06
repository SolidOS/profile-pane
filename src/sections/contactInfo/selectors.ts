import { LiveStore, NamedNode } from 'rdflib'
import { ns } from 'solid-ui'
import { AddressDetails, ContactInfo, PointDetails } from './types'


function termValue(term: any): string {
  if (!term) return ''
  if (typeof term === 'string') return term
  return term.value || ''
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

function selectEmails(subject: NamedNode, store: LiveStore): PointDetails[] {
  let emails: PointDetails[] = []
  let type = null
  let valueNode = null
  
  const emailNodes = store.each(subject, ns.vcard('hasEmail'), null, subject.doc()) || null
  emailNodes.map((node) => {
    const explicitValue = store.any(node as NamedNode, ns.vcard('value'), null, subject.doc())
    valueNode = explicitValue || node
    type = store.any(node as NamedNode, ns.rdf('type'), null, subject.doc())
    const emailValue = termValue(valueNode)
    if (isEmailValue(emailValue)) {
      emails.push({ entryNode: node, type, valueNode })
    }
  })
  return emails
}
/* SAM need to look at this doesn't seem to be working 
although it was working in add-to-contacts button */
function selectPhones(subject: NamedNode, store: LiveStore): PointDetails[] {
  let phoneNumbers: PointDetails[] = []
  let type = null
  let valueNode = null

  const phoneNodes = store.each(subject, ns.vcard('hasTelephone'), null, subject.doc()) || null
  phoneNodes.map((node) => {
    const explicitValue = store.any(node as NamedNode, ns.vcard('value'), null, subject.doc())
    valueNode = explicitValue || node
    type = store.any(node as NamedNode, ns.rdf('type'), null, subject.doc())
    const phoneValue = termValue(valueNode)
    if (isPhoneValue(phoneValue)) {
      phoneNumbers.push({ entryNode: node, type, valueNode })
    }
  })
  return phoneNumbers
}

function selectAddresses(subject: NamedNode, store: LiveStore): AddressDetails[] {
  let addresses: AddressDetails[] = []
  let type = null
  let streetAddress = null
  let locality = null
  let region = null
  let postalCode = null
  let countryName = null

  const addressNodes = store.each(subject, ns.vcard('hasAddress'), null, subject.doc()) || null
  addressNodes.map((node) => {
    streetAddress = store.any(node as NamedNode, ns.vcard('street-address'), null, subject.doc())
    locality = store.any(node as NamedNode, ns.vcard('locality'), null, subject.doc())
    region = store.any(node as NamedNode, ns.vcard('region'), null, subject.doc())
    postalCode = store.any(node as NamedNode, ns.vcard('postal-code'), null, subject.doc())
    countryName = store.any(node as NamedNode, ns.vcard('country-name'), null, subject.doc())
    type = store.any(node as NamedNode, ns.rdf('type'), null, subject.doc())
    addresses.push({entryNode: node, type, streetAddress, locality, region, postalCode, countryName})  
  })
  return addresses
}

export function presentContactInfo(subject: NamedNode, store: LiveStore): ContactInfo {
  const emails = selectEmails(subject, store)
  const phones = selectPhones(subject, store)
  const addresses = selectAddresses(subject, store)

  return { emails, phones, addresses }
}
