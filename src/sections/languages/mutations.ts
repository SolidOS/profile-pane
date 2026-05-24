import { BlankNode, Collection, LiveStore, NamedNode, Node, st, sym, literal } from 'rdflib'
import { ns } from 'solid-ui'
import { LanguageRow } from './types'
import { MutationOps, PrefixCapable, RdfFetcher, RdfStatement, RdfUpdater } from '../shared/types'
import { presentLanguages } from './selectors'
import { expandRdfList } from '../shared/rdfList'
import { createIdNode } from '../shared/idNodeFactory'
import { languageMutationSaveFailedDebugText, saveLanguageUpdatesFailedMessageText } from '../../texts'
import { findExistingNode, registerStorePrefix, runUpdateTransport } from '../shared/rdfMutationHelpers'
import { error as debugError } from '../../utils/debug'

export type LanguageMutationPlan = MutationOps<LanguageRow>
// Language entries are serialized as an ordered rdf:List of id nodes, where
// each id node points to an IANA URI via solid:publicId.
const LANGUAGE_IANA_NS = 'https://www.w3.org/ns/iana/language-code/'

function ensureLanguagePrefix(store: LiveStore) {
  registerStorePrefix(store, 'l', LANGUAGE_IANA_NS)
  registerStorePrefix((store.updater as RdfUpdater | undefined)?.store as PrefixCapable | undefined, 'l', LANGUAGE_IANA_NS)
}

function normalizeText(value: string | undefined): string {
  return (value || '').trim()
}

function normalizeLanguageCode(value: string | undefined): string {
  const normalized = normalizeText(value).toLowerCase()
  if (!normalized) return ''

  if (normalized.startsWith(LANGUAGE_IANA_NS)) {
    return normalized.slice(LANGUAGE_IANA_NS.length)
  }

  return normalized
}

function rowsFromOrderedInput(orderedRows: LanguageRow[]): LanguageRow[] {
  return (orderedRows || [])
    .filter((row) => row.status !== 'deleted')
    .filter((row) => Boolean(normalizeText(row.publicId) || normalizeText(row.name) || normalizeText(row.entryNode)))
    .map((row) => ({
      ...row,
      name: normalizeText(row.name),
      publicId: normalizeText(row.publicId),
      proficiency: normalizeText(row.proficiency),
      entryNode: normalizeText(row.entryNode)
    }))
}

function nodeKey(node: Node): string {
  return `${node.termType}:${node.value}`
}

type LanguageEntryNode = NamedNode | BlankNode

function isLanguageEntryNode(node: Node | null | undefined): node is LanguageEntryNode {
  return Boolean(node && (node.termType === 'NamedNode' || node.termType === 'BlankNode'))
}

function buildLanguageStatements(
  store: LiveStore,
  subject: NamedNode,
  doc: NamedNode,
  rows: LanguageRow[],
  existingLanguageNodes: LanguageEntryNode[]
) {
  const languageRows = rows
    .map((row) => ({
      name: normalizeText(row.name),
      publicId: normalizeLanguageCode(row.publicId),
      entryNode: normalizeText(row.entryNode)
    }))
    .filter((row) => Boolean(row.publicId))

  if (languageRows.length === 0) {
    return { statements: [] as RdfStatement[], entryNodes: [] as LanguageEntryNode[] }
  }

  const entryNodes = languageRows.map<LanguageEntryNode>((row) => {
    const existingNode = row.entryNode
      ? findExistingNode(existingLanguageNodes, row.entryNode)
      : null

    if (isLanguageEntryNode(existingNode)) {
      return existingNode
    }

    return createIdNode(doc)
  })
  const statements: RdfStatement[] = []

  statements.push(st(subject, ns.schema('knowsLanguage'), new Collection(entryNodes), doc))

  entryNodes.forEach((entryNode, index) => {
    const publicIdNode = sym(`${LANGUAGE_IANA_NS}${languageRows[index].publicId}`)
    statements.push(st(entryNode, ns.solid('publicId'), publicIdNode, doc))
    const existingNameStatement = store.holds(publicIdNode, ns.schema('name'), literal(languageRows[index].name, 'en'), doc)
    if (languageRows[index].name && !existingNameStatement) {
      statements.push(st(publicIdNode, ns.schema('name'), literal(languageRows[index].name, 'en'), doc))
    }
  })

  return { statements, entryNodes }
}

function collectListChainNodes(store: LiveStore, listHead: NamedNode, doc: NamedNode): NamedNode[] {
  const visited = new Set<string>()
  const nodes: NamedNode[] = []
  let current: NamedNode | null = listHead

  while (current) {
    const key = `${current.termType}:${current.value}`
    if (visited.has(key)) break
    visited.add(key)
    nodes.push(current)

    const rest = store.any(current as any, ns.rdf('rest'), null, doc)
    if (!rest || (rest.termType === 'NamedNode' && rest.value === ns.rdf('nil').value)) {
      break
    }
    current = (rest.termType === 'NamedNode' || rest.termType === 'BlankNode') ? rest as NamedNode : null
  }

  return nodes
}

function mergeLanguageOps(existingRows: LanguageRow[], languageOps: MutationOps<LanguageRow>): LanguageRow[] {
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
    if (!normalizeText(row.publicId)) return
    byEntryNode.set(`new:${row.name}:${Math.random()}`, {
      ...row,
      publicId: normalizeText(row.publicId),
      proficiency: normalizeText(row.proficiency)
    })
  })

  const dedupedByLanguage = new Map<string, LanguageRow>()
  Array.from(byEntryNode.values()).forEach((row) => {
    const publicId = normalizeText(row.publicId)
    if (!publicId) return
    if (!dedupedByLanguage.has(publicId)) {
      dedupedByLanguage.set(publicId, {
        ...row,
        publicId,
        proficiency: normalizeText(row.proficiency)
      })
    }
  })

  return Array.from(dedupedByLanguage.values())
}

async function mutateLanguageEntries(
  store: LiveStore,
  subject: NamedNode,
  languageOps: MutationOps<LanguageRow>,
  orderedRows?: LanguageRow[]
) {
  ensureLanguagePrefix(store)
  const doc = subject.doc()
  const existingRows = presentLanguages(subject, store).map((detail) => ({
    name: normalizeText(detail.name),
    publicId: normalizeText(detail.publicId),
    proficiency: normalizeText(detail.proficiency),
    entryNode: detail.entryNode.value,
    status: 'existing' as const
  }))
  const nextRows = orderedRows && orderedRows.length
    ? rowsFromOrderedInput(orderedRows)
    : mergeLanguageOps(existingRows, languageOps)

  const listObjects = store.each(subject, ns.schema('knowsLanguage'), null, doc)
  const existingListHeads = listObjects.filter((node): node is NamedNode => node.termType === 'BlankNode' || node.termType === 'NamedNode')
  const canForcePut = Boolean(
    (store.updater as RdfUpdater | undefined)?.serialize &&
    (store.fetcher as RdfFetcher | undefined)?.webOperation
  )
  const shouldForcePut = canForcePut

  const existingListNodes = Array.from(new Map(
    existingListHeads
      .flatMap((node) => collectListChainNodes(store, node, doc))
      .map((node) => [`${node.termType}:${node.value}`, node])
  ).values())

  const existingLanguageNodes: LanguageEntryNode[] = Array.from(new Set(
    listObjects
      .flatMap((node) => expandRdfList(store, node))
      .filter((node) => node.termType === 'NamedNode' || node.termType === 'BlankNode')
      .map((node) => `${node.termType}:${node.value}`)
  )).map((key) => {
    const [termType, ...rest] = key.split(':')
    const value = rest.join(':')
    return termType === 'BlankNode' ? store.bnode(value) : store.sym(value)
  })

  const {
    statements: insertions,
    entryNodes: nextEntryNodes
  } = buildLanguageStatements(store, subject, doc, nextRows, existingLanguageNodes)

  const retainedEntryNodeKeys = new Set(nextEntryNodes.map((node) => nodeKey(node)))
  const retainedLanguageNodes = existingLanguageNodes.filter((node) => retainedEntryNodeKeys.has(nodeKey(node)))
  const removedLanguageNodes = existingLanguageNodes.filter((node) => !retainedEntryNodeKeys.has(nodeKey(node)))

  const removedPublicIdNodes = Array.from(new Map(
    removedLanguageNodes
      .map((node) => store.any(node as NamedNode, ns.solid('publicId'), null, doc))
      .filter((node): node is NamedNode => Boolean(node && node.termType === 'NamedNode'))
      .map((node) => [nodeKey(node), node])
  ).values())

  const deletions: RdfStatement[] = store.statementsMatching(subject, ns.schema('knowsLanguage'), null, doc)
  existingListNodes.forEach((node) => {
    deletions.push(...store.statementsMatching(node, null, null, doc))
  })
  removedLanguageNodes.forEach((node) => {
    deletions.push(...store.statementsMatching(node as NamedNode, null, null, doc))
  })
  retainedLanguageNodes.forEach((node) => {
    deletions.push(...store.statementsMatching(node as NamedNode, ns.solid('publicId'), null, doc))
  })
  removedPublicIdNodes.forEach((node) => {
    deletions.push(...store.statementsMatching(node as NamedNode, ns.schema('name'), null, doc))
  })

  await runUpdateTransport(store, doc, deletions, insertions, {
    unsupportedMessage: 'Language updates are not supported by this store updater.',
    failureMessage: 'Failed to save languages',
    forcePut: shouldForcePut,
    useDavFallback: false,
    usePutFallback: true
  })
}

export async function processLanguageMutations(
  store: LiveStore,
  subject: NamedNode,
  mutationPlan: LanguageMutationPlan,
  orderedRows?: LanguageRow[]
) {
  try {
    await mutateLanguageEntries(store, subject, mutationPlan, orderedRows)

  } catch (error) {
    const rootError = error instanceof Error ? error : new Error(String(error))
    debugError(languageMutationSaveFailedDebugText, rootError)
    throw new Error(saveLanguageUpdatesFailedMessageText, { cause: rootError })
  }
} 
