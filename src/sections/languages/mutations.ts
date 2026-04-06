import { LiveStore, NamedNode, st, literal } from 'rdflib'
import { ns } from 'solid-ui'
import { LanguageRow } from './types'
import { MutationOps } from '../shared/types'
import { applyUpdaterPatch, collectLinkStatements, collectNodeStatements, findExistingNode } from '../shared/rdfMutationHelpers'
import { mutationSaveLanguagesFailedPrefixText } from '../../texts'

export type LanguageMutationPlan = MutationOps<LanguageRow>
/* SAM need to look at the new field proficiency and see how we will handle that */
function buildLanguageStatements(subject: NamedNode, doc: NamedNode, language: LanguageRow) {
  if (!language.name) return []
  return [st(subject, ns.schema('knowsLanguage'), literal(language.name), doc)]
}

async function mutateLanguageEntries(store: LiveStore, subject: NamedNode, languageOps: MutationOps<LanguageRow>) {
  const doc = subject.doc()
  const existingLanguageNodes = store.each(subject, ns.schema('knowsLanguage'))

  const deletions: any[] = []
  const insertions: any[] = []

  languageOps.remove.forEach((language) => {
    if (!language.entryNode) return
    const existingNode = findExistingNode(existingLanguageNodes, language.entryNode)
    if (existingNode) {
      deletions.push(...collectLinkStatements(store, subject, ns.schema('knowsLanguage'), existingNode, doc))
      if (existingNode.termType !== 'Literal') {
        deletions.push(...collectNodeStatements(store, existingNode, doc))
      }
    }
  })

  languageOps.update.forEach((language) => {
    if (!language.entryNode) return
    const existingNode = findExistingNode(existingLanguageNodes, language.entryNode)
    if (!existingNode) {
      insertions.push(...buildLanguageStatements(subject, doc, language))
      return
    }
    deletions.push(...collectLinkStatements(store, subject, ns.schema('knowsLanguage'), existingNode, doc))
    if (existingNode.termType !== 'Literal') {
      deletions.push(...collectNodeStatements(store, existingNode, doc))
    }
    insertions.push(...buildLanguageStatements(subject, doc, language))
  })

  languageOps.create.forEach((language) => {
    insertions.push(...buildLanguageStatements(subject, doc, language))
  })

  await applyUpdaterPatch(store, deletions, insertions)
}

export async function processLanguageMutations(store: LiveStore, subject: NamedNode, mutationPlan: LanguageMutationPlan) {
  try {
    await mutateLanguageEntries(store, subject, mutationPlan)

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${mutationSaveLanguagesFailedPrefixText} ${message}`)
  }
} 
