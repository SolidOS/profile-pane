import { LiveStore, NamedNode, Literal, Namespace, Node, Store } from "rdflib";
import { ns, utils, icons } from "solid-ui";
import { ACLControlBox5 } from "solid-ui/lib/acl/acl-control";

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
    const acIcon = store.any(subject, ns.foaf('name')) // on the account itself?
    if (acIcon) return acIcon.value;
    const classes = store.each(subject, ns.rdf('type')) as NamedNode[]
    for (const k of classes) {
      const classIcon: Node = store.any(k as NamedNode, ns.foaf('icon')) // @@ use
      if (classIcon)  {
        return classIcon.value;
      }
      return utils.label(k)
    }
    return utils.label(subject)
  }

  function iconForAccount (subject):string {
    const acIcon = store.any(subject, ns.foaf('icon')) // on the account itself?
    if (acIcon) return acIcon.value;
    const classes = store.each(subject, ns.rdf('type'))
    for (const k of classes) {
      const classIcon: Node | null  = store.any(k as any, ns.foaf('icon'))
      if (classIcon !==  null)  {
        return classIcon.value;
      }
    }
    return DEFAULT_ICON_URI
  }

  function homepageForAccount (subject):string {
    const acHomepage = store.any(subject, ns.foaf('homepage')) // on the account itself?
    if (acHomepage) return acHomepage.value;
    const id = store.anyJS(subject, ns.foaf('id')) // @@ account id 
    if (!id) return null

    const classes = store.each(subject, ns.rdf('type'))
    for (const k of classes) {
      const userProfilePrefix: Node | null = store.any(k as any, ns.foaf('userProfilePrefix'))
      if (userProfilePrefix)  {
        return userProfilePrefix.value + id ;
      }
    }
    return null
  }

  function accountAsObject (ac) {

    return {
      name: nameForAccount(ac),
      icon: iconForAccount(ac),
      homepage: homepageForAccount(ac)
    }

  }
  const accountThings: Node[] = store.each(subject, ns.foaf('account'))
  const accounts: Account[] = accountThings.map(ac => accountAsObject(ac))

  return { accounts }
}
