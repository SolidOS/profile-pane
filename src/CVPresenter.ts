import { IndexedFormula, NamedNode, Literal, Namespace, Node, Store } from "rdflib";
import { ns } from "solid-ui";

export interface Role {
  startDate?: Literal,
  endDate: Literal,
  dates: string,
  orgName: string,
  roleText: string,
  orgHomePage?: string
}
export interface CVPresentation { rolesByType: {
    PastRole: Role[];
    CurrentRole: Role[];
    FutureRole: Role[];
  };
   skills: string[];
  }

const ORG = Namespace('http://www.w3.org/ns/org#');

export const typesOfRole = ['PastRole', 'CurrentRole', 'FutureRole'];

export function skillAsText (store: Store, sk: Node):string {
  if (sk.termType === 'Literal') return sk.value // Not normal but allow this
  const publicId =  store.anyJS(sk as NamedNode, ns.solid('publicId'))
  if (publicId) {
    const name = store.anyJS(publicId, ns.schema('name'))
    if (name) return name // @@ check language and get name in diff language if necessary
  }
  const manual = store.anyJS(sk as NamedNode, ns.vcard('role'))
  if (manual) return manual
  return '¿¿¿ skill ???'
}

export function datesAsText (startDate?:Literal, endDate?:Literal):string {
  return startDate ? '(' + startDate.value.slice(0,4) + '-' +
    ( endDate ? endDate.value.slice(0,4) : '') +')'
    : ''
}

export function presentCV (
  subject: NamedNode,
  store: IndexedFormula
): CVPresentation {
  const memberships = store.each(null, ORG('member'), subject, null)

 const rolesByType = { PastRole: [], CurrentRole: [], FutureRole: [] }
  for (const membership of memberships) {
    let orgHomePage, orgNameGiven, publicIdName, roleName, publicId
     // Things should have start dates but we will be very lenient in this view
     const startDate = store.any(membership as NamedNode, ns.schema('startDate')) as Literal | null
     const endDate = store.any(membership as NamedNode, ns.schema('endDate')) as Literal | null
     const dates = datesAsText(startDate, endDate)

     const organization = store.any(membership as NamedNode, ORG('organization'))
     if (organization) {
       orgNameGiven = store.anyJS(organization as NamedNode, ns.schema('name'))
       orgHomePage = store.any(organization as NamedNode, ns.schema('uri'))
       publicId = store.any(organization as NamedNode, ns.solid('publicId'))
     }
     if (publicId) {
       publicIdName = store.anyJS(publicId as NamedNode, ns.schema('name'))
     }
     const orgName =  publicIdName || orgNameGiven

     const escoRole =  store.any(membership as NamedNode, ORG('role'))
     if (escoRole) {
       roleName =  store.anyJS(escoRole as NamedNode, ns.schema('name')) as string | null
     }
     const roleText0 = store.anyJS(membership as NamedNode, ns.vcard('role'))
     const roleText = (roleText0 && roleName) ? roleName + ' - ' + roleText0
        : roleText0 || roleName

      const item: Role = {
        startDate: startDate as Literal, endDate, orgName, roleText, dates, orgHomePage
      }

      for (const t of typesOfRole) {
        if (store.holds(membership, ns.rdf('type'), ns.solid(t))) {
           rolesByType[t].push(item)
        }
      }
   }

 // Most recent thing most relevant -> sort by end date
 for (const t of typesOfRole) {
   rolesByType[t].sort(function (x, y) {
     if (x.endDate && y.endDate) {
       return x.endDate > y.endDate ? -1 : 1
     }
     return x.startDate > y.startDate ? -1 : 1
   })
  }

  const skills = store.each(subject, ns.schema('skills')).map(sk => skillAsText(store, sk))

  return { rolesByType, skills }
}
