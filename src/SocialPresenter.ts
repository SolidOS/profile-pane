import { LiveStore, NamedNode, Node, parse } from 'rdflib'
import { ns, utils, icons } from 'solid-ui'
import profileForm from './ontology/profileForm.ttl'
import socialMedia from './ontology/socialMedia.ttl'

const DEFAULT_ICON_URI = icons.iconBase + 'noun_10636_grey.svg' // grey disc

export function loadProfileForm (store: LiveStore) {
  const preferencesForm = store.sym('https://solidos.github.io/profile-pane/src/ontology/profileForm.ttl#this')
  const preferencesFormDoc = preferencesForm.doc()
  const socialMediaDoc = store.sym('https://solidos.github.io/profile-pane/src/ontology/socialMedia.ttl').doc()
  if (!store.holds(undefined, undefined, undefined, preferencesFormDoc)) {
    // If not loaded already
    parse(profileForm, store, preferencesFormDoc.uri, 'text/turtle', () => null) // Load form directly
  }
  if (!store.holds(undefined, undefined, undefined, socialMediaDoc)) {
    // Load socialMedia ontology for icons, userProfilePrefix, etc.
    parse(socialMedia, store, socialMediaDoc.uri, 'text/turtle', () => null)
  }
}
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
    const acIcon = store.any(subject, ns.foaf('name')) ||
                   store.any(subject, ns.rdfs('label')) // on the account itself?
    if (acIcon) return acIcon.value
    const classes = store.each(subject, ns.rdf('type')) as NamedNode[]
    for (const k of classes) {
      const classIcon: Node = store.any(k as NamedNode, ns.rdfs('label'))
      if (classIcon)  {
        return classIcon.value
      }
      return utils.label(k)
    }
    return ''
  }

  function iconForAccount (subject):string {
    const acIcon = store.any(subject, ns.foaf('icon')) // on the account itself?
    if (acIcon) return acIcon.value
    const classes = store.each(subject, ns.rdf('type'))
    if (classes.length > 0) {
      console.log('@@ classes[0].termType 2 ', classes[0].termType)
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
      const userProfilePrefix: Node | null = store.any(k as any, ns.foaf('userProfilePrefix'))
      if (userProfilePrefix)  {
        return userProfilePrefix.value + id.trim() 
      }
    }
    return 'no userProfilePrefix?'
  }

  function accountAsObject (ac) {
    return {
      name: nameForAccount(ac),
      icon: iconForAccount(ac),
      homepage: homepageForAccount(ac)
    }

  }
  loadProfileForm(store) // get ontology info

  const accountThings: Node[] = store.anyJS(subject, ns.foaf('account')) // load the collection
  if (!accountThings) return { accounts: []} // could have been undefined
  //console.log('Social: accountThings', accountThings)
  const accounts: Account[] = accountThings.map(ac => accountAsObject(ac))
  //console.log('Social: account objects', accounts)


  return { accounts }
}
