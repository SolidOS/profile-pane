import { ns} from 'solid-ui'
import type { BioDetails } from './types'
import { LiveStore, NamedNode } from 'rdflib'


export const presentBio = (
  subject: NamedNode,
  store: LiveStore
): BioDetails => {

  const description = store.anyJS(subject, ns.vcard('note'))

  return {
    description,
    entryNode: subject
  }
}
