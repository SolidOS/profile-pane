import { NamedNode, Store, Node, LiveStore } from 'rdflib'
import { ns, utils } from 'solid-ui'
import { LanguageDetails } from './types'
import { expandRdfList } from '../shared/rdfList'

export function languageAsText (store: Store, lan: Node):string {
  if (lan.termType === 'Literal') return lan.value // Not normal but allow this

  const publicId = store.anyJS(lan as NamedNode, ns.solid('publicId'))
  if (publicId)
    return utils.label(publicId, true) // @@ check language and get name in diff language if necessary

  return ''                                                  
}

export function presentLanguages(subject: NamedNode, store: LiveStore): LanguageDetails[] {
  const languageNodes = store.each(subject, ns.schema('knowsLanguage'))
  const details: LanguageDetails[] = languageNodes
    .flatMap(node => expandRdfList(store, node))
    .map((lan) => ({
      name: languageAsText(store, lan),
      proficiency: store.anyValue(lan as NamedNode, ns.schema('proficiencyLevel')) || undefined,
      entryNode: lan
    }))
    .filter((item) => Boolean(item.name))

  const dedupedByLanguage = new Map<string, LanguageDetails>()
  details.forEach((item) => {
    if (!dedupedByLanguage.has(item.name)) {
      dedupedByLanguage.set(item.name, item)
    }
  })

  return Array.from(dedupedByLanguage.values())
}
