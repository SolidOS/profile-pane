import { LiveStore, NamedNode, st, literal } from 'rdflib'
import { ns } from 'solid-ui'
import { SkillRow } from './types'
import { MutationOps } from '../shared/types'
import { applyUpdaterPatch, collectLinkStatements, collectNodeStatements, findExistingNode } from '../shared/rdfMutationHelpers'
import { mutationSaveSkillsFailedPrefixText } from '../../texts'

export type SkillMutationPlan = MutationOps<SkillRow>

function buildSkillsStatements(subject: NamedNode, doc: NamedNode, skill: SkillRow) {
  if (!skill.name) return []
  return [st(subject, ns.schema('skills'), literal(skill.name), doc)]
}

async function mutateSkillsEntries(store: LiveStore, subject: NamedNode, skillOps: MutationOps<SkillRow>) {
  const doc = subject.doc()
  const existingSkillNodes = store.each(subject, ns.schema('skills'))

  const deletions: any[] = []
  const insertions: any[] = []

  skillOps.remove.forEach((skill) => {
    if (!skill.entryNode) return
    const existingNode = findExistingNode(existingSkillNodes, skill.entryNode)
    if (existingNode) {
      deletions.push(...collectLinkStatements(store, subject, ns.schema('skills'), existingNode, doc))
      if (existingNode.termType !== 'Literal') {
        deletions.push(...collectNodeStatements(store, existingNode, doc))
      }
    }
  })

  skillOps.update.forEach((skill) => {
    if (!skill.entryNode) return
    const existingNode = findExistingNode(existingSkillNodes, skill.entryNode)
    if (!existingNode) {
      insertions.push(...buildSkillsStatements(subject, doc, skill))
      return
    }
    deletions.push(...collectLinkStatements(store, subject, ns.schema('skills'), existingNode, doc))
    if (existingNode.termType !== 'Literal') {
      deletions.push(...collectNodeStatements(store, existingNode, doc))
    }
    insertions.push(...buildSkillsStatements(subject, doc, skill))
  })

  skillOps.create.forEach((skill) => {
    insertions.push(...buildSkillsStatements(subject, doc, skill))
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
