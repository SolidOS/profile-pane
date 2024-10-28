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

export interface RolesByType {
  PastRole: Role[];
  CurrentRole: Role[];
  FutureRole: Role[];
}

export function presentSocial(
  subject: NamedNode,
  store: LiveStore
): SocialPresentation {
  
  function nameForAccount (subject) {
    const acIcon = store.any(subject, ns.foaf('name')) // on the account itself?
    if (acIcon) return acIcon.value;
    const classes = store.each(subject, ns.rdf('type'))
    for (const k of classes) {
      const classIcon = store.any(k, ns.foaf('icon'))
      if (classIcon)  {
        return classIcon.value;
      }
    }
    return utils.label(subject)
  }

  function iconForAccount (subject) {
    const acIcon = store.any(subject, ns.foaf('icon')) // on the account itself?
    if (acIcon) return acIcon.uri;
    const classes = store.each(subject, ns.rdf('type'))
    for (const k of classes) {
      const classIcon = store.any(k, ns.foaf('icon'))
      if (classIcon)  {
        return classIcon.uri;
      }
    }
    return DEFAULT_ICON_URI
  }

  function homepageForAccount (subject) {
    const acHomepage = store.any(subject, ns.foaf('homepage')) // on the account itself?
    if (acHomepage) return acHomepage.uri;
    const accountId = store.anyJS(subject, ns.foaf('id')) || 'NoId?'
    const classes = store.each(subject, ns.rdf('type'))
    for (const k in classes) {
      const classIcon = store.each(k, ns.foaf('icon'))
      if (classIcon)  {
        return classIcon.uri;
      }
    }
    return DEFAULT_ICON_URI
  }

  function accountAsObject (ac) {
    return {
      name: nameForAccount(ac),
      icon: iconForAccount(ac),
      homepage: homepageForAccount(ac)
    }

  }
  const accounts = store.each(subject, ns.foaf('account')).map(ac => accountAsObject(ac))

  return { accounts }
}
