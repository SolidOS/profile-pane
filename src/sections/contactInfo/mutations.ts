import { LiveStore, NamedNode, Node, st } from "rdflib"
import { ns } from "solid-ui"
import { ContactAddressRow, ContactMutationPlan, ContactPointRow } from "./types"
import { MutationOps } from "../shared/types"
import { applyUpdaterPatch, collectLinkStatements, collectNodeStatements, findExistingNode } from "../shared/rdfMutationHelpers"

function buildPhoneStatements(subject: NamedNode, doc: NamedNode, node: Node, phone: ContactPointRow) {
  const normalizedValue = phone.value.startsWith('tel:') ? phone.value : `tel:${phone.value}`
  const inserts = [
    st(subject, ns.vcard('hasTelephone'), node as any, doc),
    st(node as any, ns.vcard('value'), normalizedValue as any, doc)
  ]

  if (phone.type) {
    inserts.push(st(node as any, ns.rdf('type'), ns.vcard(phone.type), doc))
  }

  return inserts
}

function buildEmailStatements(subject: NamedNode, doc: NamedNode, node: Node, email: ContactPointRow) {
  const normalizedValue = email.value.startsWith('mailto:') ? email.value : `mailto:${email.value}`
  const inserts = [
    st(subject, ns.vcard('hasEmail'), node as any, doc),
    st(node as any, ns.vcard('value'), normalizedValue as any, doc)
  ]

  if (email.type) {
    inserts.push(st(node as any, ns.rdf('type'), ns.vcard(email.type), doc))
  }

  return inserts
}

function buildAddressStatements(subject: NamedNode, doc: NamedNode, node: Node, address: ContactAddressRow) {
  const inserts = [st(subject, ns.vcard('hasAddress'), node as any, doc)]

  if (address.type) inserts.push(st(node as any, ns.rdf('type'), ns.vcard(address.type), doc))
  if (address.streetAddress) inserts.push(st(node as any, ns.vcard('street-address'), address.streetAddress as any, doc))
  if (address.locality) inserts.push(st(node as any, ns.vcard('locality'), address.locality as any, doc))
  if (address.region) inserts.push(st(node as any, ns.vcard('region'), address.region as any, doc))
  if (address.postalCode) inserts.push(st(node as any, ns.vcard('postal-code'), address.postalCode as any, doc))
  if (address.countryName) inserts.push(st(node as any, ns.vcard('country-name'), address.countryName as any, doc))

  return inserts
}

async function mutatePhoneEntries(store: LiveStore, subject: NamedNode, phoneOps: MutationOps<ContactPointRow>) {
  const doc = subject.doc()
  const existingPhoneNodes = store.each(subject, ns.vcard('hasTelephone'), null, doc) as Node[]
  const deletions: any[] = []
  const insertions: any[] = []

  phoneOps.remove.forEach((phone) => {
    if (!phone.entryNode) return
    const existingNode = findExistingNode(existingPhoneNodes, phone.entryNode)
    if (existingNode) {
      deletions.push(...collectLinkStatements(store, subject, ns.vcard('hasTelephone'), existingNode, doc))
      deletions.push(...collectNodeStatements(store, existingNode, doc))
    }
  })

  phoneOps.update.forEach((phone) => {
    if (!phone.entryNode) return
    const existingNode = findExistingNode(existingPhoneNodes, phone.entryNode)
    if (!existingNode) {
      insertions.push(...buildPhoneStatements(subject, doc, store.bnode(), phone))
      return
    }
    deletions.push(...collectNodeStatements(store, existingNode, doc))
    insertions.push(...buildPhoneStatements(subject, doc, existingNode, phone))
  })

  phoneOps.create.forEach((phone) => {
    insertions.push(...buildPhoneStatements(subject, doc, store.bnode(), phone))
  })

  await applyUpdaterPatch(store, deletions, insertions)
}

async function mutateEmailEntries(store: LiveStore, subject: NamedNode, emailOps: MutationOps<ContactPointRow>) {
  const doc = subject.doc()
  const existingEmailNodes = store.each(subject, ns.vcard('hasEmail'), null, doc) as Node[]
  const deletions: any[] = []
  const insertions: any[] = []

  emailOps.remove.forEach((email) => {
    if (!email.entryNode) return
    const existingNode = findExistingNode(existingEmailNodes, email.entryNode)
    if (existingNode) {
      deletions.push(...collectLinkStatements(store, subject, ns.vcard('hasEmail'), existingNode, doc))
      deletions.push(...collectNodeStatements(store, existingNode, doc))
    }
  })

  emailOps.update.forEach((email) => {
    if (!email.entryNode) return
    const existingNode = findExistingNode(existingEmailNodes, email.entryNode)
    if (!existingNode) {
      insertions.push(...buildEmailStatements(subject, doc, store.bnode(), email))
      return
    }
    deletions.push(...collectNodeStatements(store, existingNode, doc))
    insertions.push(...buildEmailStatements(subject, doc, existingNode, email))
  })

  emailOps.create.forEach((email) => {
    insertions.push(...buildEmailStatements(subject, doc, store.bnode(), email))
  })

  await applyUpdaterPatch(store, deletions, insertions)
}

async function mutateAddressEntries(store: LiveStore, subject: NamedNode, addressOps: MutationOps<ContactAddressRow>) {
  const doc = subject.doc()
  const existingAddressNodes = store.each(subject, ns.vcard('hasAddress'), null, doc) as Node[]
  const deletions: any[] = []
  const insertions: any[] = []

  addressOps.remove.forEach((address) => {
    if (!address.entryNode) return
    const existingNode = findExistingNode(existingAddressNodes, address.entryNode)
    if (existingNode) {
      deletions.push(...collectLinkStatements(store, subject, ns.vcard('hasAddress'), existingNode, doc))
      deletions.push(...collectNodeStatements(store, existingNode, doc))
    }
  })

  addressOps.update.forEach((address) => {
    if (!address.entryNode) return
    const existingNode = findExistingNode(existingAddressNodes, address.entryNode)
    if (!existingNode) {
      insertions.push(...buildAddressStatements(subject, doc, store.bnode(), address))
      return
    }
    deletions.push(...collectNodeStatements(store, existingNode, doc))
    insertions.push(...buildAddressStatements(subject, doc, existingNode, address))
  })

  addressOps.create.forEach((address) => {
    insertions.push(...buildAddressStatements(subject, doc, store.bnode(), address))
  })

  await applyUpdaterPatch(store, deletions, insertions)
}

export async function processContactInfoMutations(store: LiveStore, subject: NamedNode, mutationPlan: ContactMutationPlan) {
  try {
    await mutatePhoneEntries(store, subject, mutationPlan.phoneOps)
    await mutateEmailEntries(store, subject, mutationPlan.emailOps)
    await mutateAddressEntries(store, subject, mutationPlan.addressOps)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to save contact info: ${message}`)
  }
} 
