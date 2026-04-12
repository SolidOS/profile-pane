import { LiveStore, NamedNode, st, literal, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { SkillRow } from './types'
import { MutationOps } from '../shared/types'
import { applyUpdaterPatch, collectLinkedNodeStatements, collectNodeStatements, findExistingNode } from '../shared/rdfMutationHelpers'
import { createIdNode } from '../shared/idNodeFactory'
import { mutationSaveSkillsFailedPrefixText } from '../../texts'

export type SkillMutationPlan = MutationOps<SkillRow>

const ESCO_SKILL_BASE_URI = 'http://data.europa.eu/esco/skill/'
const SKILL_PREFIX_BASE_URI = 'skill:'

function ensureSkillPrefix(store: LiveStore) {
  const anyStore = store as any
  if (typeof anyStore.setPrefixForURI === 'function') {
    anyStore.setPrefixForURI('skill', SKILL_PREFIX_BASE_URI)
    return
  }
  if (!anyStore.namespaces) {
    anyStore.namespaces = {}
  }
  anyStore.namespaces.skill = SKILL_PREFIX_BASE_URI
}

function normalizeSkillPublicIdUri(publicId: string): string {
  const normalized = publicId.trim()
  if (!normalized) return normalized
  if (normalized.startsWith('skill:')) {
    return normalized
  }
  if (normalized.startsWith(ESCO_SKILL_BASE_URI)) {
    const suffix = normalized.slice(ESCO_SKILL_BASE_URI.length)
    return suffix ? `skill:${suffix}` : normalized
  }
  return normalized
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
  if (!skill.publicId) {
    throw new Error(`Missing skill publicId for skill: ${skill.name}`)
  }
  const publicIdNode = sym(normalizeSkillPublicIdUri(skill.publicId))

  return [
    st(subject, ns.schema('skills'), node, doc),
    st(node, ns.solid('publicId'), publicIdNode as any, doc),
    st(publicIdNode as any, ns.schema('name'), literal(skill.name), doc)
  ]
}

async function mutateSkillsEntries(store: LiveStore, subject: NamedNode, skillOps: MutationOps<SkillRow>) {
  ensureSkillPrefix(store)
  const doc = subject.doc()
  const existingSkillNodes = store.each(subject, ns.schema('skills'))

  const deletions: any[] = []
  const insertions: any[] = []

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

  await applyUpdaterPatch(store, deletions, insertions)
}

export async function processSkillsMutations(store: LiveStore, subject: NamedNode, mutationPlan: SkillMutationPlan) {
  try {
    await mutateSkillsEntries(store, subject, mutationPlan)

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${mutationSaveSkillsFailedPrefixText} ${message}`)
  }
} 
