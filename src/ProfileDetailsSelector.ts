import { LiveStore, NamedNode, Node, Store } from 'rdflib'
import { ns, utils } from 'solid-ui'

type ProfileDetails = {
  skills: string[],
  languages: string[]
}

function expandRdfList(store: Store, node: Node): Node[] {
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

export function skillAsText (store: Store, sk: Node):string {
  if (sk.termType === 'Literal') return sk.value // Not normal but allow this
  const publicId =  store.anyJS(sk as NamedNode, ns.solid('publicId'))
  if (publicId) {
    const name = store.anyJS(publicId, ns.schema('name'))
    if (name) return name // @@ check language and get name in diff language if necessary
  }

  const manual = store.anyJS(sk as NamedNode, ns.vcard('role'))
  if (manual && manual[0] > '') return manual
  return ''
}

export function languageAsText (store: Store, lan: Node):string {
  if (lan.termType === 'Literal') return lan.value // Not normal but allow this
  const publicId = store.anyJS(lan as NamedNode, ns.solid('publicId'))
  if (publicId)
    return utils.label(publicId, true) // @@ check language and get name in diff language if necessary
  return ''                                                  
}

function getSkills(subject: NamedNode, store: LiveStore): string[] {
  return store
    .each(subject, ns.schema('skills'))
    .map((sk) => skillAsText(store, sk))
    .filter((skill) => skill !== '')
}

function getLanguages(subject: NamedNode, store: LiveStore): string[] {
  const languageNodes = store.each(subject, ns.schema('knowsLanguage'))
  const languages = languageNodes
    .flatMap(node => expandRdfList(store, node))
    .map(lan => languageAsText(store, lan))
  // Deduplicate languages
  return Array.from(new Set(languages))
}

export function selectProfileDetails(
  subject: NamedNode,
  store: LiveStore
): ProfileDetails {
  
  const skills = getSkills(subject, store)

  const languages = getLanguages(subject, store)

  return { skills, languages }

}