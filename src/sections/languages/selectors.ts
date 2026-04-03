import { NamedNode, Store, Node, LiveStore } from "rdflib";
import { ns, utils } from "solid-ui";
import { LanguageDetails } from "./types"

export function expandRdfList(store: Store, node: Node): Node[] {
  const collectionElements = (node as { termType?: string; elements?: Node[] }).elements
  if (Array.isArray(collectionElements)) {
    return collectionElements.flatMap(element => expandRdfList(store, element))
  }

  const first = store.any(node as NamedNode, ns.rdf('first'))
  if (!first) return [node]

  const items: Node[] = []
  let current: Node | null = node
  while (current) {
    const value = store.any(current as NamedNode, ns.rdf('first')) as Node | null
    if (value) items.push(...expandRdfList(store, value))
    const rest = store.any(current as NamedNode, ns.rdf('rest')) as Node | null
    if (!rest || (rest.termType === 'NamedNode' && rest.value === ns.rdf('nil').value)) break
    current = rest
  }
  return items
}

export function languageAsText (store: Store, lan: Node):string {
  if (lan.termType === 'Literal') return lan.value // Not normal but allow this
  const publicId = store.anyJS(lan as NamedNode, ns.solid('publicId'))
  if (publicId)
    return utils.label(publicId, true) // @@ check language and get name in diff language if necessary
  return ''                                                  
}

export function selectLanguages(subject: NamedNode, store: LiveStore): LanguageDetails[] {
  const languageNodes = store.each(subject, ns.schema('knowsLanguage'))
  const details: LanguageDetails[] = languageNodes
    .flatMap(node => expandRdfList(store, node))
    .map((lan) => ({
      name: languageAsText(store, lan),
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
