import { LiveStore, NamedNode, Node, st, literal, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { ProfileBasicRow, HeadingMutationPlan } from './types'
import { MutationOps } from '../shared/types'
import { applyUpdaterPatch, collectLinkStatements, collectNodeStatements, findExistingNode } from '../shared/rdfMutationHelpers'
import { createIdNode } from '../shared/idNodeFactory'
import { saveHeadingUpdatesFailedPrefixText } from '../../texts'
import { ContactAddressRow, ContactPointRow } from '../contactInfo/types'

type CleanupSummary = {
  deletedStatements: number
  removedOrphanNodes: number
  removedKnowsLanguageLinks: number
}

function statementKey(statement: any): string {
  return `${statement.subject?.toNT?.() || statement.subject?.value} ${statement.predicate?.toNT?.() || statement.predicate?.value} ${statement.object?.toNT?.() || statement.object?.value} ${statement.why?.toNT?.() || statement.why?.value}`
}

function dedupeStatements(statements: any[]): any[] {
  return Array.from(new Map((statements || []).map((statement) => [statementKey(statement), statement])).values())
}

function isPatchFailure(message: string): boolean {
  const text = (message || '').toLowerCase()
  return (
    text.includes(' on patch ') ||
    text.includes('web error: 500') ||
    text.includes('web error: 501') ||
    text.includes('web error: 405') ||
    text.includes('web error: 400')
  )
}

function isMissingGetRecordError(message: string): boolean {
  return (message || '').toLowerCase().includes('no record of our http get request for document')
}

function sanitizePatchStatements(store: LiveStore, deletions: any[], insertions: any[]) {
  const safeDeletions = Array.from(new Map(
    (deletions || [])
      .filter((statement) => {
        if (!statement || !statement.subject || !statement.predicate || !statement.object) return false
        return store.holds(statement.subject, statement.predicate, statement.object, statement.why)
      })
      .map((statement) => [statementKey(statement), statement])
  ).values())

  const safeInsertions = Array.from(new Map(
    (insertions || [])
      .filter((statement) => Boolean(statement && statement.subject && statement.predicate && statement.object))
      .map((statement) => [statementKey(statement), statement])
  ).values())

  return { safeDeletions, safeInsertions }
}

async function runPutFallback(store: LiveStore, doc: NamedNode, deletions: any[], insertions: any[]) {
  const updater = store.updater as any
  const fetcher = (store as any).fetcher

  if (!updater || typeof updater.serialize !== 'function' || !fetcher || typeof fetcher.webOperation !== 'function') {
    throw new Error('Cleanup updates are not supported by this store updater.')
  }

  const currentStatements = store.statementsMatching(undefined, undefined, undefined, doc).slice()
  const deletionKeys = new Set((deletions || []).map((statement) => statementKey(statement)))
  const nextStatements = currentStatements.filter((statement) => !deletionKeys.has(statementKey(statement))).concat(insertions || [])

  const contentType = 'text/turtle'
  const body = updater.serialize(doc.value, nextStatements, contentType)
  const response = await fetcher.webOperation('PUT', doc.uri, {
    noMeta: true,
    contentType,
    body
  })

  if (!response || response.ok !== true) {
    const status = response?.status || 'unknown'
    throw new Error(`Web error: ${status} on PUT of <${doc.uri}>`)
  }

  store.remove(deletions)
  insertions.forEach((statement) => {
    store.add(statement.subject, statement.predicate, statement.object, statement.why)
  })
}

async function runUpdateWithDavFallback(store: LiveStore, doc: NamedNode, deletions: any[], insertions: any[]) {
  const updater = store.updater as any
  if (!updater || typeof updater.update !== 'function') {
    throw new Error('Cleanup updates are not supported by this store updater.')
  }

  const { safeDeletions, safeInsertions } = sanitizePatchStatements(store, deletions, insertions)
  if (safeDeletions.length === 0 && safeInsertions.length === 0) {
    return
  }

  const tryUpdate = () => new Promise<void>((resolve, reject) => {
    updater.update(safeDeletions, safeInsertions, (_uri: string, ok: boolean, message?: string) => {
      if (ok === true) {
        resolve()
        return
      }
      reject(new Error(message || 'Failed to clean profile graph'))
    })
  })

  try {
    await tryUpdate()
    return
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!isPatchFailure(message) || typeof updater.updateDav !== 'function') {
      throw error
    }

    if (store.fetcher && typeof (store.fetcher as any).load === 'function') {
      try {
        await (store.fetcher as any).load(doc)
      } catch {
        // Continue to fallback.
      }
    }

    try {
      await new Promise<void>((resolve, reject) => {
        updater.updateDav(doc, safeDeletions, safeInsertions, (_uri: string, ok: boolean, body?: string) => {
          if (ok === true) {
            resolve()
            return
          }
          reject(new Error(body || message || 'Failed to clean profile graph'))
        })
      })
    } catch (davError) {
      const davMessage = davError instanceof Error ? davError.message : String(davError)
      if (!isMissingGetRecordError(davMessage)) {
        throw davError
      }
      await runPutFallback(store, doc, safeDeletions, safeInsertions)
    }
  }
}

function isLocalProfileNode(node: Node | null | undefined, doc: NamedNode): node is Node {
  if (!node) return false
  if (node.termType === 'BlankNode') return true
  if (node.termType !== 'NamedNode') return false
  return node.value === doc.value || node.value.startsWith(`${doc.value}#`)
}

function collectKnowsLanguageCascadeDeletions(store: LiveStore, subject: NamedNode, doc: NamedNode): any[] {
  const deletions: any[] = []
  const visited = new Set<string>()
  const queue: Node[] = []
  const knowsLanguageStatements = store.statementsMatching(subject, ns.schema('knowsLanguage'), null, doc)

  deletions.push(...knowsLanguageStatements)
  knowsLanguageStatements.forEach((statement) => {
    queue.push(statement.object as Node)
  })

  while (queue.length > 0) {
    const current = queue.shift() as Node
    const currentKey = current.termType === 'BlankNode' ? `_:${current.value}` : current.value
    if (visited.has(currentKey)) continue
    visited.add(currentKey)

    const nodeStatements = store.statementsMatching(current as any, null, null, doc)
    deletions.push(...nodeStatements)

    nodeStatements.forEach((statement) => {
      const next = statement.object as Node
      if (isLocalProfileNode(next, doc)) {
        queue.push(next)
      }
    })
  }

  return dedupeStatements(deletions)
}

function collectReachableLocalNodeKeys(store: LiveStore, doc: NamedNode, roots: Node[]): Set<string> {
  const reachable = new Set<string>()
  const queue = roots.filter((root) => isLocalProfileNode(root, doc))

  while (queue.length > 0) {
    const current = queue.shift() as Node
    const currentKey = current.termType === 'BlankNode' ? `_:${current.value}` : current.value
    if (reachable.has(currentKey)) continue
    reachable.add(currentKey)

    const nextStatements = store.statementsMatching(current as any, null, null, doc)
    nextStatements.forEach((statement) => {
      const next = statement.object as Node
      if (!isLocalProfileNode(next, doc)) return
      const nextKey = next.termType === 'BlankNode' ? `_:${next.value}` : next.value
      if (!reachable.has(nextKey)) {
        queue.push(next)
      }
    })
  }

  return reachable
}

function collectOrphanNodeDeletions(store: LiveStore, subject: NamedNode, doc: NamedNode, baseDeletions: any[]): { orphanNodes: Node[]; deletions: any[] } {
  const baseDeletionKeys = new Set(baseDeletions.map((statement) => statementKey(statement)))
  const docStatements = store
    .statementsMatching(undefined, undefined, undefined, doc)
    .filter((statement) => !baseDeletionKeys.has(statementKey(statement)))

  const localNodeByKey = new Map<string, Node>()
  docStatements.forEach((statement) => {
    if (isLocalProfileNode(statement.subject as Node, doc)) {
      const subjectNode = statement.subject as Node
      const subjectKey = subjectNode.termType === 'BlankNode' ? `_:${subjectNode.value}` : subjectNode.value
      localNodeByKey.set(subjectKey, subjectNode)
    }
    if (isLocalProfileNode(statement.object as Node, doc)) {
      const objectNode = statement.object as Node
      const objectKey = objectNode.termType === 'BlankNode' ? `_:${objectNode.value}` : objectNode.value
      localNodeByKey.set(objectKey, objectNode)
    }
  })

  const reachable = collectReachableLocalNodeKeys(store, doc, [subject])
  const subjectKey = subject.value

  const orphanNodes = Array.from(localNodeByKey.entries())
    .filter(([key]) => key !== subjectKey && !reachable.has(key))
    .map(([, node]) => node)

  const orphanDeletions = dedupeStatements(orphanNodes.flatMap((node) => store.statementsMatching(node as any, null, null, doc)))
  return { orphanNodes, deletions: orphanDeletions }
}

export async function cleanupHeadingLanguagesAndOrphans(store: LiveStore, subject: NamedNode): Promise<CleanupSummary> {
  const doc = subject.doc()
  const knowsLanguageStatements = store.statementsMatching(subject, ns.schema('knowsLanguage'), null, doc)
  const knowsLanguageDeletions = collectKnowsLanguageCascadeDeletions(store, subject, doc)
  const orphanResult = collectOrphanNodeDeletions(store, subject, doc, knowsLanguageDeletions)
  const deletions = dedupeStatements([...knowsLanguageDeletions, ...orphanResult.deletions])

  await runUpdateWithDavFallback(store, doc, deletions, [])

  return {
    deletedStatements: deletions.length,
    removedOrphanNodes: orphanResult.orphanNodes.length,
    removedKnowsLanguageLinks: knowsLanguageStatements.length
  }
}

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
