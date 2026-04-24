import { LiveStore, NamedNode, literal } from 'rdflib'
import { ns } from 'solid-ui'
import { BioMutationPlan, BioRow } from './types'
import { MutationOps } from '../shared/types'
import { applyUpdaterPatch, replacePredicateStatements } from '../shared/rdfMutationHelpers'
import { saveBioUpdatesFailedPrefixText} from '../../texts'
// Need to find out if this is really how we should store the data
async function mutateBioEntry(store: LiveStore, subject: NamedNode, bioOps: MutationOps<BioRow>) {
  const doc = subject.doc()
  const deletions: any[] = []
  const insertions: any[] = []

  const replaceLiteralField = (predicate: NamedNode, value?: string) => {
    const normalized = (value || '').trim()
    const nextObject = normalized ? literal(normalized) : null
    replacePredicateStatements(store, subject, predicate, doc, deletions, insertions, nextObject)
  }

  const applyBasics = (bio: BioRow, clearAll = false) => {
    const data = clearAll
      ? {
          description: '',
        }
      : bio

    replaceLiteralField(ns.vcard('note'), data.description)
  }

  const removeBio = bioOps.remove[0]
  const updateBio = bioOps.update[0]
  const createBio = bioOps.create[0]

  const selectedBio = updateBio || createBio || removeBio
  if (selectedBio) {
    applyBasics(selectedBio, Boolean(removeBio && !updateBio && !createBio))
  }

  await applyUpdaterPatch(store, deletions, insertions)
}

export async function processBioMutations(store: LiveStore, subject: NamedNode, mutationPlan: BioMutationPlan) {
  try {
    await mutateBioEntry(store, subject, mutationPlan)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${saveBioUpdatesFailedPrefixText} ${message}`)
  }
} 
