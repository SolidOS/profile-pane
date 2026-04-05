import { LiveStore, NamedNode } from 'rdflib'
import { ns } from 'solid-ui'
import { Account, SocialPresentation } from './types'
import { expandRdfList } from '../shared/rdfList'
import {
  ensureSocialOntologyLoaded,
  homepageForAccount,
  iconForAccount,
  nameForAccount
} from './helpers'


export function presentSocial(
  subject: NamedNode,
  store: LiveStore
): SocialPresentation {
  function accountAsObject (ac: NamedNode): Account {
    return {
      name: nameForAccount(store, ac),
      icon: iconForAccount(store, ac),
      homepage: homepageForAccount(store, ac),
      entryNode: ac
    }

  }
 
  // we need to load the social media accounts ontology to be able to query all data needed
  ensureSocialOntologyLoaded(store)

  const accountNodes = store.each(subject, ns.foaf('account'))
  let accountThings = accountNodes.flatMap(node => expandRdfList(store, node))
  // Deduplicate by foaf:accountName value
  const accountNameSet = new Set<string>()
  const accounts: Account[] = []
  for (const ac of accountThings) {
    if (ac.termType === 'NamedNode') {
      const accountNameNode = store.any(ac as NamedNode, ns.foaf('accountName'))
      const dedupeKey = accountNameNode ? accountNameNode.value : (ac as NamedNode).value
      if (!accountNameSet.has(dedupeKey)) {
        accountNameSet.add(dedupeKey)
        accounts.push(accountAsObject(ac as NamedNode))
      }
    }
  }
  if (!accounts.length) return { accounts: [] }
  return { accounts }
}
