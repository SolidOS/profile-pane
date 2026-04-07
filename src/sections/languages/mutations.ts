import { LiveStore, NamedNode, st, literal } from 'rdflib'
import { ns } from 'solid-ui'
import { LanguageRow } from './types'
import { MutationOps } from '../shared/types'
import { presentLanguages } from './selectors'
import { expandRdfList } from '../shared/rdfList'
import { createIdNode } from '../shared/idNodeFactory'
import { mutationSaveLanguagesFailedPrefixText } from '../../texts'

export type LanguageMutationPlan = MutationOps<LanguageRow>
/* SAM need to look at the new field proficiency and see how we will handle that */
function normalizedLanguageName(value: string | undefined): string {
  return (value || '').trim()
}

function buildLanguageStatements(store: LiveStore, subject: NamedNode, doc: NamedNode, names: string[]) {
  const languageNames = names
    .map((name) => normalizedLanguageName(name))
    .filter(Boolean)

  if (languageNames.length === 0) return []

  const entryNodes = languageNames.map(() => createIdNode(doc))
  const publicIdNodes = languageNames.map(() => createIdNode(doc))
  const head = store.bnode()
  const statements = [st(subject, ns.schema('knowsLanguage'), head, doc)]

  let current = head
  entryNodes.forEach((node, index) => {
    statements.push(st(current, ns.rdf('first'), node, doc))
    if (index === entryNodes.length - 1) {
      statements.push(st(current, ns.rdf('rest'), ns.rdf('nil'), doc))
      return
    }

    const next = store.bnode()
    statements.push(st(current, ns.rdf('rest'), next, doc))
    current = next
  })

  entryNodes.forEach((node, index) => {
    const publicIdNode = publicIdNodes[index]
    statements.push(st(node, ns.solid('publicId'), publicIdNode, doc))
    statements.push(st(publicIdNode, ns.schema('name'), literal(languageNames[index]), doc))
    statements.push(st(publicIdNode, ns.rdf('type'), ns.schema('Language'), doc))
  })

  return statements
}

function isPatchFailure(message: string): boolean {
  const text = (message || '').toLowerCase()
  // Different pods surface PATCH incompatibility with different status codes/messages.
  return text.includes(' on patch ') || text.includes('web error: 501') || text.includes('web error: 405') || text.includes('web error: 400')
}

function isMissingGetRecordError(message: string): boolean {
  return (message || '').toLowerCase().includes('no record of our http get request for document')
}

function statementKey(statement: any): string {
  return `${statement.subject?.toNT?.() || statement.subject?.value} ${statement.predicate?.toNT?.() || statement.predicate?.value} ${statement.object?.toNT?.() || statement.object?.value} ${statement.why?.toNT?.() || statement.why?.value}`
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
    throw new Error('Language updates are not supported by this store updater.')
  }

  const currentStatements = store.statementsMatching(undefined, undefined, undefined, doc).slice()
  const deletionKeys = new Set((deletions || []).map((statement) => statementKey(statement)))
  // Rebuild full document state for PUT when patch-oriented flows cannot be used.
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

  // PUT bypasses UpdateManager's local-store patching, so apply the same changes locally.
  store.remove(deletions)
  insertions.forEach((statement) => {
    store.add(statement.subject, statement.predicate, statement.object, statement.why)
  })
}

async function runUpdateWithDavFallback(store: LiveStore, doc: NamedNode, deletions: any[], insertions: any[]) {
  const updater = store.updater as any
  if (!updater || typeof updater.update !== 'function') {
    throw new Error('Language updates are not supported by this store updater.')
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
      reject(new Error(message || 'Failed to save languages'))
    })
  })

  try {
    // Preferred path: let rdflib pick the server-supported update protocol.
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
        // Continue; updateDav may still fail and we handle that below.
      }
    }

    try {
      // First fallback for PATCH failures: DAV-style whole-document update.
      await new Promise<void>((resolve, reject) => {
        updater.updateDav(doc, safeDeletions, safeInsertions, (_uri: string, ok: boolean, body?: string) => {
          if (ok === true) {
            resolve()
            return
          }
          reject(new Error(body || message || 'Failed to save languages'))
        })
      })
    } catch (davError) {
      const davMessage = davError instanceof Error ? davError.message : String(davError)
      if (!isMissingGetRecordError(davMessage)) {
        throw davError
      }
      // Some stores cannot run updateDav without prior fetch metadata; use direct PUT.
      await runPutFallback(store, doc, safeDeletions, safeInsertions)
    }
  }
}

function mergeLanguageOps(existingRows: LanguageRow[], languageOps: MutationOps<LanguageRow>): string[] {
  const byEntryNode = new Map<string, LanguageRow>()
  existingRows.forEach((row) => {
    byEntryNode.set(row.entryNode, row)
  })

  languageOps.remove.forEach((row) => {
    if (!row.entryNode) return
    byEntryNode.delete(row.entryNode)
  })

  languageOps.update.forEach((row) => {
    if (!row.entryNode) return
    if (!byEntryNode.has(row.entryNode)) return
    byEntryNode.set(row.entryNode, row)
  })

  languageOps.create.forEach((row) => {
    if (!normalizedLanguageName(row.name)) return
    byEntryNode.set(`new:${row.name}:${Math.random()}`, row)
  })

  const dedupedNames = new Set<string>()
  Array.from(byEntryNode.values()).forEach((row) => {
    const normalized = normalizedLanguageName(row.name)
    if (normalized) dedupedNames.add(normalized)
  })

  return Array.from(dedupedNames)
}

async function mutateLanguageEntries(store: LiveStore, subject: NamedNode, languageOps: MutationOps<LanguageRow>) {
  const doc = subject.doc()
  const existingRows = presentLanguages(subject, store).map((detail) => ({
    name: normalizedLanguageName(detail.name),
    proficiency: '',
    entryNode: detail.entryNode.value,
    status: 'existing' as const
  }))
  const nextNames = mergeLanguageOps(existingRows, languageOps)

  const listObjects = store.each(subject, ns.schema('knowsLanguage'), null, doc)
  const existingLanguageNodes = Array.from(new Set(
    listObjects
      .flatMap((node) => expandRdfList(store, node))
      .filter((node) => node.termType === 'NamedNode')
      .map((node) => node.value)
  )).map((value) => store.sym(value))

  const existingPublicIdNodes = Array.from(new Set(
    existingLanguageNodes
      .map((node) => store.any(node as NamedNode, ns.solid('publicId'), null, doc))
      .filter((node): node is NamedNode => Boolean(node && node.termType === 'NamedNode'))
      .map((node) => node.value)
  )).map((value) => store.sym(value))

  const deletions = store.statementsMatching(subject, ns.schema('knowsLanguage'), null, doc)
  existingLanguageNodes.forEach((node) => {
    deletions.push(...store.statementsMatching(node as NamedNode, null, null, doc))
  })
  existingPublicIdNodes.forEach((node) => {
    deletions.push(...store.statementsMatching(node as NamedNode, null, null, doc))
  })
  const insertions = buildLanguageStatements(store, subject, doc, nextNames)

  await runUpdateWithDavFallback(store, doc, deletions, insertions)
}

export async function processLanguageMutations(store: LiveStore, subject: NamedNode, mutationPlan: LanguageMutationPlan) {
  try {
    await mutateLanguageEntries(store, subject, mutationPlan)

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${mutationSaveLanguagesFailedPrefixText} ${message}`)
  }
} 
