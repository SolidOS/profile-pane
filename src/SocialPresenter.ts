import { LiveStore, NamedNode, Node } from 'rdflib'
import { ns, utils, icons } from 'solid-ui'
import socialMediaForm from './ontology/socialMedia.ttl'
import { loadDocument } from './rdfFormsHelper'

const socialMediaFormName = 'socialMedia.ttl' // The name of the file to upload

const DEFAULT_ICON_URI = icons.iconBase + 'noun_10636_grey.svg' // grey disc
export interface Account {
  name: string,
  icon: string,
  homepage: string,
}
export interface SocialPresentation { 
  accounts: Account[];
}

function expandRdfList(store: LiveStore, node: Node): Node[] {
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

export function presentSocial(
  subject: NamedNode,
  store: LiveStore
): SocialPresentation {
  
  function nameForAccount (subject):string {
    const acName = store.any(subject, ns.foaf('name')) ||
                   store.any(subject, ns.rdfs('label')) // on the account itself?
    if (acName) return acName.value
    const classes = store.each(subject, ns.rdf('type')) as NamedNode[]
    for (const k of classes) {
      const classIcon: Node = store.any(k as NamedNode, ns.rdfs('label'))
      if (classIcon)  {
        return classIcon.value
      }
      return utils.label(k)
    }
    return 'Unknown Account'
  }

  function iconForAccount (subject):string {
    const acIcon = store.any(subject, ns.foaf('icon')) // on the account itself?
    if (acIcon) return acIcon.value
    const classes = store.each(subject, ns.rdf('type'))
    if (classes.length > 0) {
      
      for (const k of (classes as Node[])) {
        const classIcon: Node | null  = store.any(k as any, ns.foaf('icon'))
        if (classIcon !==  null)  {
          return classIcon.value
        }
      }
    }
    return DEFAULT_ICON_URI
  }

  function homepageForAccount (subject):string {
    const id = store.anyJS(subject, ns.foaf('accountName'), null, subject.doc()) || '' 
    const classes = store.each(subject, ns.rdf('type'))
    for (const k of classes) {
      const userProfilePrefix: Node | null = store.any(k as any, ns.foaf('userProfilePrefix'))
      if (userProfilePrefix)  {
        return userProfilePrefix.value + id.trim() 
      }
    }
    return store.anyJS(subject, ns.foaf('homepage'), null, subject.doc()) || ''
  }

  function accountAsObject (ac) {
    return {
      name: nameForAccount(ac),
      icon: iconForAccount(ac),
      homepage: homepageForAccount(ac)
    }

  }
 
  // we need to load the social media accounts ontology to be able to query all data needed
  loadDocument(socialMediaFormName, socialMediaForm, store)

  const accountNodes = store.each(subject, ns.foaf('account'))
  const accountThings = accountNodes.flatMap(node => expandRdfList(store, node))
  if (!accountThings.length) return { accounts: [] }
  //console.log('Social: accountThings', accountThings)
  const accounts: Account[] = accountThings.map(ac => accountAsObject(ac))
  //console.log('Social: account objects', accounts)

  return { accounts }
}
