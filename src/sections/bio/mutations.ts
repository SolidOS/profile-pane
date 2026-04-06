import { LiveStore, NamedNode, st, literal } from 'rdflib'
import { ns } from 'solid-ui'
import { BioMutationPlan, BioRow } from './types'
import { MutationOps } from '../shared/types'
import { applyUpdaterPatch} from '../shared/rdfMutationHelpers'
import { saveBioUpdatesFailedPrefixText} from '../../texts'
// Need to find out if this is really how we should store the data
async function mutateBioEntry(store: LiveStore, subject: NamedNode, bioOps: MutationOps<BioRow>) {
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

  const applyBasics = (bio: BioRow, clearAll = false) => {
    const data = clearAll
      ? {
          description: '',
        }
      : bio

    replaceLiteralField(ns.schema('description'), data.description)
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
