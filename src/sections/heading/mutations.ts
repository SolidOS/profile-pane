import { LiveStore, NamedNode, Node, st, literal, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { ProfileBasicRow, HeadingMutationPlan } from './types'
import { MutationOps } from '../shared/types'
import { applyUpdaterPatch, collectLinkStatements, collectNodeStatements, findExistingNode } from '../shared/rdfMutationHelpers'
import { createIdNode } from '../shared/idNodeFactory'
import { saveHeadingUpdatesFailedPrefixText } from '../../texts'
import { ContactAddressRow, ContactPointRow } from '../contactInfo/types'

function buildPhoneStatements(subject: NamedNode, doc: NamedNode, node: Node, phone: ContactPointRow) {
  const normalizedValue = phone.value.startsWith('tel:') ? phone.value : `tel:${phone.value}`
  const valueNode = sym(normalizedValue)
  const inserts = [
    st(subject, ns.vcard('hasTelephone'), node as any, doc),
    st(node as any, ns.vcard('value'), valueNode as any, doc)
  ]

  if (phone.type) {
    inserts.push(st(node as any, ns.rdf('type'), ns.vcard(phone.type), doc))
  }

  return inserts
}

function buildEmailStatements(subject: NamedNode, doc: NamedNode, node: Node, email: ContactPointRow) {
  const normalizedValue = email.value.startsWith('mailto:') ? email.value : `mailto:${email.value}`
  const valueNode = sym(normalizedValue)
  const inserts = [
    st(subject, ns.vcard('hasEmail'), node as any, doc),
    st(node as any, ns.vcard('value'), valueNode as any, doc)
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

function findOpWithExistingEntry<T extends { entryNode: string }>(ops: T[], existingNodes: Node[]): T | undefined {
  return ops.find((op) => Boolean(op.entryNode) && Boolean(findExistingNode(existingNodes, op.entryNode)))
}

function findCreateOp<T extends { entryNode: string }>(ops: T[]): T | undefined {
  return ops.find((op) => !op.entryNode)
}

function statementKey(statement: any): string {
  return `${statement.subject?.toNT?.() || statement.subject?.value} ${statement.predicate?.toNT?.() || statement.predicate?.value} ${statement.object?.toNT?.() || statement.object?.value} ${statement.why?.toNT?.() || statement.why?.value}`
}

function uniqueStatements(statements: any[]): any[] {
  return Array.from(new Map((statements || []).map((statement) => [statementKey(statement), statement])).values())
}

function collectListChainNodes(store: LiveStore, listHead: any, doc: NamedNode): Node[] {
  const visited = new Set<string>()
  const nodes: Node[] = []
  let current = listHead

  while (current) {
    const key = `${current.termType}:${current.value}`
    if (visited.has(key)) break
    visited.add(key)
    nodes.push(current)

    const rest = store.any(current as NamedNode, ns.rdf('rest'), null, doc) as any
    if (!rest || (rest.termType === 'NamedNode' && rest.value === ns.rdf('nil').value)) {
      break
    }
    current = rest
  }

  return nodes
}

function isLocalIdNode(value: string, doc: NamedNode): boolean {
  return value.startsWith(`${doc.value}#id`)
}

export async function cleanupHeadingLanguagesAndOrphans(store: LiveStore, subject: NamedNode) {
  const doc = subject.doc()
  const deletions: any[] = []

  const knowsLanguageLinks = store.statementsMatching(subject, ns.schema('knowsLanguage'), null, doc)
  const removedKnowsLanguageLinks = knowsLanguageLinks.length
  deletions.push(...knowsLanguageLinks)

  const listHeads = knowsLanguageLinks
    .map((statement) => statement.object)
    .filter((node) => node.termType === 'BlankNode' || node.termType === 'NamedNode')

  const listNodes = Array.from(new Map(
    listHeads
      .flatMap((node) => collectListChainNodes(store, node, doc))
      .map((node) => [`${node.termType}:${node.value}`, node])
  ).values())

  const languageNodes = listNodes
    .flatMap((node) => store.each(node as any, ns.rdf('first'), null, doc) as Node[])
    .filter((node) => node.termType === 'NamedNode' || node.termType === 'BlankNode')

  listNodes.forEach((node) => {
    deletions.push(...store.statementsMatching(node as any, null, null, doc))
  })

  languageNodes.forEach((node) => {
    deletions.push(...store.statementsMatching(node as any, null, null, doc))

    const publicIdNode = store.any(node as any, ns.solid('publicId'), null, doc) as Node | null
    if (publicIdNode && publicIdNode.termType === 'NamedNode') {
      deletions.push(...store.statementsMatching(publicIdNode as any, null, null, doc))
    }
  })

  const idNodeSubjects = Array.from(new Set(
    store
      .statementsMatching(null as any, null, null, doc)
      .filter((statement) => statement.subject?.termType === 'NamedNode' && isLocalIdNode(statement.subject.value, doc))
      .map((statement) => statement.subject.value)
  )).map((value) => sym(value))

  let removedOrphanNodes = 0
  idNodeSubjects.forEach((node) => {
    const hasIncoming = store.statementsMatching(null as any, null, node as any, doc).length > 0
    if (hasIncoming) return

    const nodeStatements = store.statementsMatching(node as any, null, null, doc)
    if (nodeStatements.length === 0) return

    removedOrphanNodes += 1
    deletions.push(...nodeStatements)
  })

  const uniqueDeletions = uniqueStatements(deletions)
  await applyUpdaterPatch(store, uniqueDeletions, [])

  return {
    removedKnowsLanguageLinks,
    removedOrphanNodes,
    deletedStatements: uniqueDeletions.length
  }
}

async function mutatePhoneEntry(store: LiveStore, subject: NamedNode, phoneOps: MutationOps<ContactPointRow>) {
  const doc = subject.doc()
  const existingPhoneNodes = store.each(subject, ns.vcard('hasTelephone'), null, doc) as Node[]
  const deletions: any[] = []
  const insertions: any[] = []

  const removePhone = findOpWithExistingEntry(phoneOps.remove, existingPhoneNodes)
  const updatePhone = findOpWithExistingEntry(phoneOps.update, existingPhoneNodes)
  const createPhone = findCreateOp(phoneOps.create) || phoneOps.create[0]

  if (removePhone?.entryNode) {
    const existingNode = findExistingNode(existingPhoneNodes, removePhone.entryNode)
    if (existingNode) {
      deletions.push(...collectLinkStatements(store, subject, ns.vcard('hasTelephone'), existingNode, doc))
      deletions.push(...collectNodeStatements(store, existingNode, doc))
    }
  }

  if (updatePhone) {
    const existingNode = findExistingNode(existingPhoneNodes, updatePhone.entryNode)
    if (existingNode) {
      deletions.push(...collectNodeStatements(store, existingNode, doc))
      insertions.push(...buildPhoneStatements(subject, doc, existingNode, updatePhone))
    }
  }

  if (createPhone) {
    insertions.push(...buildPhoneStatements(subject, doc, createIdNode(doc), createPhone))
  }

  await applyUpdaterPatch(store, deletions, insertions)
}

async function mutateEmailEntry(store: LiveStore, subject: NamedNode, emailOps: MutationOps<ContactPointRow>) {
  const doc = subject.doc()
  const existingEmailNodes = store.each(subject, ns.vcard('hasEmail'), null, doc) as Node[]
  const deletions: any[] = []
  const insertions: any[] = []

  const removeEmail = findOpWithExistingEntry(emailOps.remove, existingEmailNodes)
  const updateEmail = findOpWithExistingEntry(emailOps.update, existingEmailNodes)
  const createEmail = findCreateOp(emailOps.create) || emailOps.create[0]

  if (removeEmail?.entryNode) {
    const existingNode = findExistingNode(existingEmailNodes, removeEmail.entryNode)
    if (existingNode) {
      deletions.push(...collectLinkStatements(store, subject, ns.vcard('hasEmail'), existingNode, doc))
      deletions.push(...collectNodeStatements(store, existingNode, doc))
    }
  }

  if (updateEmail) {
    const existingNode = findExistingNode(existingEmailNodes, updateEmail.entryNode)
    if (existingNode) {
      deletions.push(...collectNodeStatements(store, existingNode, doc))
      insertions.push(...buildEmailStatements(subject, doc, existingNode, updateEmail))
    }
  }

  if (createEmail) {
    insertions.push(...buildEmailStatements(subject, doc, createIdNode(doc), createEmail))
  }

  await applyUpdaterPatch(store, deletions, insertions)
}

async function mutateAddressEntry(store: LiveStore, subject: NamedNode, addressOps: MutationOps<ContactAddressRow>) {
  const doc = subject.doc()
  const existingAddressNodes = store.each(subject, ns.vcard('hasAddress'), null, doc) as Node[]
  const deletions: any[] = []
  const insertions: any[] = []

  const removeAddress = findOpWithExistingEntry(addressOps.remove, existingAddressNodes)
  const updateAddress = findOpWithExistingEntry(addressOps.update, existingAddressNodes)
  const createAddress = findCreateOp(addressOps.create) || addressOps.create[0]

  if (removeAddress?.entryNode) {
    const existingNode = findExistingNode(existingAddressNodes, removeAddress.entryNode)
    if (existingNode) {
      deletions.push(...collectLinkStatements(store, subject, ns.vcard('hasAddress'), existingNode, doc))
      deletions.push(...collectNodeStatements(store, existingNode, doc))
    }
  }

  if (updateAddress) {
    const existingNode = findExistingNode(existingAddressNodes, updateAddress.entryNode)
    if (existingNode) {
      deletions.push(...collectNodeStatements(store, existingNode, doc))
      insertions.push(...buildAddressStatements(subject, doc, existingNode, updateAddress))
    }
  }

  if (createAddress) {
    insertions.push(...buildAddressStatements(subject, doc, createIdNode(doc), createAddress))
  }

  await applyUpdaterPatch(store, deletions, insertions)
}

async function mutateBasicProfileEntry(store: LiveStore, subject: NamedNode, basicOps: MutationOps<ProfileBasicRow>) {
  const doc = subject.doc()
  const deletions: any[] = []
  const insertions: any[] = []

  const replaceLiteralField = (predicate: NamedNode, value?: string) => {
    deletions.push(...store.statementsMatching(subject, predicate, null, doc))
    const normalized = (value || '').trim()
    if (normalized) {
      insertions.push(st(subject, predicate, literal(normalized), doc))
    }
  }

  const replacePhotoField = (value?: string) => {
    deletions.push(...store.statementsMatching(subject, ns.vcard('hasPhoto'), null, doc))
    const normalized = (value || '').trim()
    if (!normalized) return

    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      insertions.push(st(subject, ns.vcard('hasPhoto'), sym(normalized), doc))
    } else {
      insertions.push(st(subject, ns.vcard('hasPhoto'), literal(normalized), doc))
    }
  }

  const applyBasics = (basic: ProfileBasicRow, clearAll = false) => {
    const data = clearAll
      ? {
          name: '',
          nickname: '',
          dateOfBirth: '',
          jobTitle: '',
          orgName: '',
          imageSrc: ''
        }
      : basic

    replaceLiteralField(ns.vcard('fn'), data.name)
    // Keep foaf:nick in sync where available in existing data.
    replaceLiteralField(ns.foaf('nick'), data.nickname)
    replaceLiteralField(ns.vcard('nickname'), data.nickname)
    replaceLiteralField(ns.vcard('bday'), data.dateOfBirth)
    replaceLiteralField(ns.vcard('role'), data.jobTitle)
    replaceLiteralField(ns.vcard('organization-name'), data.orgName)
    replacePhotoField(data.imageSrc)
  }

  const removeBasic = basicOps.remove[0]
  const updateBasic = basicOps.update[0]
  const createBasic = basicOps.create[0]

  const selectedBasic = updateBasic || createBasic || removeBasic
  if (selectedBasic) {
    applyBasics(selectedBasic, Boolean(removeBasic && !updateBasic && !createBasic))
  }

  await applyUpdaterPatch(store, deletions, insertions)
}

export async function processHeadingMutations(store: LiveStore, subject: NamedNode, mutationPlan: HeadingMutationPlan) {
  try {
    await mutateBasicProfileEntry(store, subject, mutationPlan.basicOps)
    await mutatePhoneEntry(store, subject, mutationPlan.phoneOps)
    await mutateEmailEntry(store, subject, mutationPlan.emailOps)
    await mutateAddressEntry(store, subject, mutationPlan.addressOps)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${saveHeadingUpdatesFailedPrefixText} ${message}`)
  }
} 
