import { LiveStore, NamedNode, st, literal } from 'rdflib'
import { ns } from 'solid-ui'
import { SkillRow } from './types'
import { MutationOps } from '../shared/types'
import { applyUpdaterPatch, collectLinkedNodeStatements, collectLinkStatements, collectNodeStatements, findExistingNode } from '../shared/rdfMutationHelpers'
import { createIdNode } from '../shared/idNodeFactory'
import { mutationSaveSkillsFailedPrefixText } from '../../texts'

export type SkillMutationPlan = MutationOps<SkillRow>

function buildSkillsStatements(subject: NamedNode, doc: NamedNode, node: NamedNode, skill: SkillRow) {
  if (!skill.name) return []
  const publicIdNode = createIdNode(doc)
  return [
    st(subject, ns.schema('skills'), node, doc),
    st(node, ns.solid('publicId'), publicIdNode, doc),
    st(publicIdNode, ns.schema('name'), literal(skill.name), doc),
    st(publicIdNode, ns.rdf('type'), ns.schema('Skill'), doc)
  ]
}

async function mutateSkillsEntries(store: LiveStore, subject: NamedNode, skillOps: MutationOps<SkillRow>) {
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
    if (existingNode) {
      deletions.push(...collectLinkStatements(store, subject, ns.schema('skills'), existingNode, doc))
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
    deletions.push(...collectLinkStatements(store, subject, ns.schema('skills'), existingNode, doc))
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
