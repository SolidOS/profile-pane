import { blankNode, LiveStore, NamedNode, Node, st, literal, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { SkillRow } from './types'
import { MutationOps, RdfStatement } from '../shared/types'
import { collectLinkedNodeStatements, collectNodeStatements, findExistingNode, registerStorePrefix, runUpdateTransport } from '../shared/rdfMutationHelpers'
import { createIdNode } from '../shared/idNodeFactory'
import { saveSkillsUpdatesFailedMessageText, skillsMutationSaveFailedDebugText } from '../../texts'
import { error as debugError } from '../../utils/debug'

export type SkillMutationPlan = MutationOps<SkillRow>

const ESCO_SKILL_BASE_URI = 'http://data.europa.eu/esco/skill/'
const SKILL_PREFIX_BASE_URI = 'skill:'

function ensureSkillPrefix(store: LiveStore) {
  registerStorePrefix(store, 'skill', SKILL_PREFIX_BASE_URI)
}

function buildSkillPublicIdNode(publicId: string): Node {
  const normalized = publicId.trim()
  if (!normalized) return blankNode()
  if (normalized.startsWith('_:')) {
    return blankNode(normalized.slice(2))
  }
  if (normalized.startsWith('skill:')) {
    return sym(normalized)
  }
  if (normalized.startsWith(ESCO_SKILL_BASE_URI)) {
    const suffix = normalized.slice(ESCO_SKILL_BASE_URI.length)
    return sym(suffix ? `skill:${suffix}` : normalized)
  }
  if (!normalized.includes(':')) {
    return blankNode(normalized)
  }
  return sym(normalized)
}

function normalizeNodeId(value: string): string {
  return value.startsWith('_:') ? value.slice(2) : value
}

function collectSkillLinkStatementsByEntryValue(
  store: LiveStore,
  subject: NamedNode,
  doc: NamedNode,
  entryNode: string
) {
  const normalizedEntryNode = normalizeNodeId(entryNode)
  return store
    .statementsMatching(subject, ns.schema('skills'), null, doc)
    .filter((statement) => {
      const objectValue = normalizeNodeId(statement.object.value)
      return objectValue === normalizedEntryNode || statement.object.value === entryNode
    })
}

function buildSkillsStatements(subject: NamedNode, doc: NamedNode, node: NamedNode, skill: SkillRow) {
  if (!skill.name) return []
  const publicIdNode = buildSkillPublicIdNode(skill.publicId)

  return [
    st(subject, ns.schema('skills'), node, doc),
    st(node, ns.solid('publicId'), publicIdNode, doc),
    st(publicIdNode as any, ns.schema('name'), literal(skill.name), doc)
  ]
}

async function mutateSkillsEntries(store: LiveStore, subject: NamedNode, skillOps: MutationOps<SkillRow>) {
  ensureSkillPrefix(store)
  const doc = subject.doc()
  const existingSkillNodes = store.each(subject, ns.schema('skills'))

  const deletions: RdfStatement[] = []
  const insertions: RdfStatement[] = []

  const collectLinkedPublicIdStatements = (skillNode: NamedNode) => {
    const linkedPublicIdStatements = collectLinkedNodeStatements(store, skillNode, ns.solid('publicId'), doc)
    deletions.push(...linkedPublicIdStatements.linkedStatements)
  }

  skillOps.remove.forEach((skill) => {
    if (!skill.entryNode) return
    const existingNode = findExistingNode(existingSkillNodes, skill.entryNode)
    deletions.push(...collectSkillLinkStatementsByEntryValue(store, subject, doc, skill.entryNode))
    if (existingNode) {
      if (existingNode.termType !== 'Literal') {
        deletions.push(...collectNodeStatements(store, existingNode, doc))
        if (existingNode.termType === 'NamedNode') {
          collectLinkedPublicIdStatements(existingNode as NamedNode)
        }
      }
    }
  })

  skillOps.update.forEach((skill) => {
    if (!skill.entryNode) return
    const existingNode = findExistingNode(existingSkillNodes, skill.entryNode)
    if (!existingNode) {
      insertions.push(...buildSkillsStatements(subject, doc, createIdNode(doc), skill))
      return
    }
    deletions.push(...collectSkillLinkStatementsByEntryValue(store, subject, doc, skill.entryNode))
    if (existingNode.termType !== 'Literal') {
      deletions.push(...collectNodeStatements(store, existingNode, doc))
      if (existingNode.termType === 'NamedNode') {
        collectLinkedPublicIdStatements(existingNode as NamedNode)
      }
    }
    if (existingNode.termType === 'NamedNode') {
      insertions.push(...buildSkillsStatements(subject, doc, existingNode as NamedNode, skill))
      return
    }
    insertions.push(...buildSkillsStatements(subject, doc, createIdNode(doc), skill))
  })

  skillOps.create.forEach((skill) => {
    insertions.push(...buildSkillsStatements(subject, doc, createIdNode(doc), skill))
  })

  await runUpdateTransport(store, doc, deletions, insertions, {
    unsupportedMessage: 'Skill updates are not supported by this store updater.',
    failureMessage: 'Failed to save skills',
    useDavFallback: true,
    usePutFallback: true
  })
}

export async function processSkillsMutations(store: LiveStore, subject: NamedNode, mutationPlan: SkillMutationPlan) {
  try {
    await mutateSkillsEntries(store, subject, mutationPlan)

  } catch (error) {
    const rootError = error instanceof Error ? error : new Error(String(error))
    debugError(skillsMutationSaveFailedDebugText, rootError)
    throw new Error(saveSkillsUpdatesFailedMessageText, { cause: rootError })
  }
} 
