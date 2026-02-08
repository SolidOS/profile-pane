import { LiveStore, NamedNode, Node, parse } from 'rdflib'
import { ns, utils, icons } from 'solid-ui'
import profileForm from './ontology/profileForm.ttl'
import socialMedia from './ontology/socialMedia.ttl'

const DEFAULT_ICON_URI = icons.iconBase + 'noun_10636_grey.svg' // grey disc

export function loadProfileForm (store: LiveStore): Promise<void> {
  console.log('[loadProfileForm] Starting ontology load...')
  const preferencesForm = store.sym('https://solidos.github.io/profile-pane/src/ontology/profileForm.ttl#this')
  const preferencesFormDoc = preferencesForm.doc()
  const socialMediaDoc = store.sym('https://solidos.github.io/profile-pane/src/ontology/socialMedia.ttl').doc()
  
  return new Promise((resolve, reject) => {
    const promises: Promise<void>[] = []
    
    if (!store.holds(undefined, undefined, undefined, preferencesFormDoc)) {
      console.log('[loadProfileForm] Loading profileForm.ttl...')
      promises.push(new Promise<void>((res, rej) => {
        parse(profileForm, store, preferencesFormDoc.uri, 'text/turtle', (err) => {
          if (err) {
            console.error('[loadProfileForm] Error loading profileForm:', err)
            rej(err)
          } else {
            console.log('[loadProfileForm] profileForm.ttl loaded successfully')
            res()
          }
        })
      }))
    } else {
      console.log('[loadProfileForm] profileForm.ttl already loaded')
    }
    
    if (!store.holds(undefined, undefined, undefined, socialMediaDoc)) {
      console.log('[loadProfileForm] Loading socialMedia.ttl...')
      promises.push(new Promise<void>((res, rej) => {
        parse(socialMedia, store, socialMediaDoc.uri, 'text/turtle', (err) => {
          if (err) {
            console.error('[loadProfileForm] Error loading socialMedia:', err)
            rej(err)
          } else {
            console.log('[loadProfileForm] socialMedia.ttl loaded successfully')
            res()
          }
        })
      }))
    } else {
      console.log('[loadProfileForm] socialMedia.ttl already loaded')
    }
    
    if (promises.length === 0) {
      console.log('[loadProfileForm] All ontologies already loaded, resolving immediately')
      resolve()
    } else {
      Promise.all(promises).then(() => {
        console.log('[loadProfileForm] All ontologies loaded successfully')
        resolve()
      }).catch(reject)
    }
  })
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
  console.log('[presentSocial] Starting to present social data for', subject.uri)
  
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
    console.log('[homepageForAccount] Account classes:', classes.map(c => c.value))
    for (const k of classes) {
      const userProfilePrefix: Node | null = store.any(k as any, ns.foaf('userProfilePrefix'))
      console.log('[homepageForAccount] Checking class', k.value, 'for userProfilePrefix:', userProfilePrefix?.value)
      if (userProfilePrefix)  {
        return userProfilePrefix.value + id.trim() 
      }
    }
    console.warn('[homepageForAccount] No userProfilePrefix found for any class')
    return 'no userProfilePrefix?'
  }

  function accountAsObject (ac) {
    return {
      name: nameForAccount(ac),
      icon: iconForAccount(ac),
      homepage: homepageForAccount(ac)
    }

  }
  // Ontology should be pre-loaded by caller via loadProfileForm(store)

  const accountThings: Node[] = store.anyJS(subject, ns.foaf('account')) // load the collection
  if (!accountThings) return { accounts: []} // could have been undefined
  //console.log('Social: accountThings', accountThings)
  const accounts: Account[] = accountThings.map(ac => accountAsObject(ac))
  //console.log('Social: account objects', accounts)


  return { accounts }
}
