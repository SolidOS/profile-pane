import { LiveStore, NamedNode, Node } from 'rdflib'
import { ns, utils, icons } from 'solid-ui'
import socialMediaForm from '../ontology/socialMedia.ttl'
import { loadDocument } from '../rdfFormsHelper'
import { expandRdfList } from '../sections/shared/rdfList'

// Note: This file was copied to src/sections/social/selectors.ts and edited there. Edits here will not be reflected in the app. Please make any necessary edits in the selectors file.
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
    const acHomepage = store.any(subject, ns.foaf('homepage')) // on the account itself?
    if (acHomepage) return acHomepage.value
    const id = store.anyJS(subject, ns.foaf('accountName'), null, subject.doc()) || 'No_account_Name'
    const classes = store.each(subject, ns.rdf('type'))
    for (const k of classes) {
      // Fix: ensure k is a NamedNode for store.any
      if (k.termType === 'NamedNode') {
        const userProfilePrefix: Node | null = store.any(k as NamedNode, ns.foaf('userProfilePrefix'))
        if (userProfilePrefix) {
          return userProfilePrefix.value + id.trim()
        }
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
  loadDocument(store, socialMediaForm, socialMediaFormName)

  const accountNodes = store.each(subject, ns.foaf('account'))
  let accountThings = accountNodes.flatMap(node => expandRdfList(store, node))
  // Deduplicate by foaf:accountName value
  const accountNameSet = new Set<string>()
  const accounts: Account[] = []
  for (const ac of accountThings) {
    if (ac.termType === 'NamedNode') {
      const accountNameNode = store.any(ac as NamedNode, ns.foaf('accountName'))
      const accountName = accountNameNode ? accountNameNode.value : ''
      if (!accountNameSet.has(accountName)) {
        accountNameSet.add(accountName)
        accounts.push(accountAsObject(ac))
      }
    }
  }
  if (!accounts.length) return { accounts: [] }
  return { accounts }
}
