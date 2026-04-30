import { blankNode, LiveStore, NamedNode, st, sym, literal } from 'rdflib'
import { ns } from 'solid-ui'
import { LanguageRow } from './types'
import { MutationOps, PrefixCapable, RdfStatement, RdfUpdater } from '../shared/types'
import { presentLanguages } from './selectors'
import { expandRdfList } from '../shared/rdfList'
import { createIdNode } from '../shared/idNodeFactory'
import { mutationSaveLanguagesFailedPrefixText } from '../../texts'
import { registerStorePrefix, runUpdateTransport } from '../shared/rdfMutationHelpers'

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

function buildRdfListStatements(items: NamedNode[], doc: NamedNode) {
  if (!items.length) {
    return {
      head: ns.rdf('nil'),
      statements: [] as RdfStatement[]
    }
  }

  const listNodes = items.map(() => blankNode())
  const statements: RdfStatement[] = []

  items.forEach((item, index) => {
    const current = listNodes[index]
    const next = listNodes[index + 1] || ns.rdf('nil')
    statements.push(st(current, ns.rdf('first'), item, doc))
    statements.push(st(current, ns.rdf('rest'), next, doc))
  })

  return {
    head: listNodes[0],
    statements
  }
}

function buildLanguageStatements(subject: NamedNode, doc: NamedNode, rows: LanguageRow[]) {
  const languageRows = rows
    .map((row) => ({
      name: normalizeText(row.name),
      publicId: normalizeLanguageCode(row.publicId),
    }))
    .filter((row) => Boolean(row.publicId))

  if (languageRows.length === 0) return []

  const entryNodes = languageRows.map(() => createIdNode(doc))
  const statements: RdfStatement[] = []

  const rdfList = buildRdfListStatements(entryNodes, doc)
  statements.push(st(subject, ns.schema('knowsLanguage'), rdfList.head, doc))
  statements.push(...rdfList.statements)

  entryNodes.forEach((entryNode, index) => {
    const publicIdNode = sym(`${LANGUAGE_IANA_NS}${languageRows[index].publicId}`)
    statements.push(st(entryNode, ns.solid('publicId'), publicIdNode, doc))
    if (languageRows[index].name) {
      statements.push(st(publicIdNode, ns.schema('name'), literal(languageRows[index].name, 'en'), doc))
    }
  })

  return statements
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

  const existingListNodes = Array.from(new Map(
    existingListHeads
      .flatMap((node) => collectListChainNodes(store, node, doc))
      .map((node) => [`${node.termType}:${node.value}`, node])
  ).values())

  const existingLanguageNodes = Array.from(new Set(
    listObjects
      .flatMap((node) => expandRdfList(store, node))
      .filter((node) => node.termType === 'NamedNode' || node.termType === 'BlankNode')
      .map((node) => `${node.termType}:${node.value}`)
  )).map((key) => {
    const [termType, ...rest] = key.split(':')
    const value = rest.join(':')
    return termType === 'BlankNode' ? store.bnode(value) : store.sym(value)
  })

  const existingPublicIdNodes = Array.from(new Map(
    existingLanguageNodes
      .map((node) => store.any(node as NamedNode, ns.solid('publicId'), null, doc))
      .filter((node): node is NamedNode => Boolean(node && node.termType === 'NamedNode'))
      .map((node) => [`${node.termType}:${node.value}`, node])
  ).values())

  const deletions: RdfStatement[] = store.statementsMatching(subject, ns.schema('knowsLanguage'), null, doc)
  existingListNodes.forEach((node) => {
    deletions.push(...store.statementsMatching(node, null, null, doc))
  })
  existingLanguageNodes.forEach((node) => {
    // Remove old language-entry statements so save always rewrites canonical shape.
    deletions.push(...store.statementsMatching(node as NamedNode, null, null, doc))
  })
  existingPublicIdNodes.forEach((node) => {
    // Language labels are attached to the publicId resource (l:xx) and should be removed for deleted rows.
    deletions.push(...store.statementsMatching(node as NamedNode, ns.schema('name'), null, doc))
  })
  const insertions: RdfStatement[] = buildLanguageStatements(subject, doc, nextRows)

  await runUpdateTransport(store, doc, deletions, insertions, {
    unsupportedMessage: 'Language updates are not supported by this store updater.',
    failureMessage: 'Failed to save languages',
    useDavFallback: true,
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
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${mutationSaveLanguagesFailedPrefixText} ${message}`)
  }
} 
