import { IndexedFormula, NamedNode, Literal, Namespace } from "rdflib";
import { ns, language } from "solid-ui";
import { findImage } from "solid-ui/lib/widgets/buttons";
import Node from "rdflib/src/node-internal";
import { validateHTMLColorHex } from "validate-color";

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

export function presentCV (
  subject: NamedNode,
  store: IndexedFormula
): CVPresentation {
  const profile = subject.doc()
  const memberships = store.each(null, ORG('member'), subject, null)

  function initialArray () {
    const ar:Role[] = []
    return ar
  }

 const rolesByType = { PastRole: [], CurrentRole: [], FutureRole: [] }
  /*
  for (const t of typesOfRole) {
   rolesByType[t] = []
  }
  */
  // const now = Literal.fromValue(new Date()) // toISOString
  let endDate
  for (const membership of memberships) {
    let endDate, orgHomePage, orgNameGiven, publicIdName, roleName, publicId
     if (store.holds(membership, ns.rdf('type'), ns.solid('PastRole'))) {
       endDate = store.any(membership as any, ns.schema('endDate'))
     }

/* Just for the record this would not be a bad way to write this code in future
  const where = store.setDoc(profile).setFolloing(false).ns(ns).where
  const {  startDate, endDate, orgName, roleText, dates, orgHomePage, orgNameGiven } =
    where`
      ${membership} schema:startDate $startDate;
                    schema:endDate? $endDate;  # optional
                    org:organization ?org .

      ?org   schema:name ?orgNameGiven;
            solid:publicId ?publicId;
            schema:uri ?orgHomePage .

      ?publicId schema:name ?orgName .
     `;
  */

     // Things should have start dates but we will be very lenient in this view
     //endDate = endDate || now
     const startDate = store.any(membership as any, ns.schema('startDate')) as Literal
     // const publicId = store.any(membership as any, ns.solid('publicId'))
     const organization = store.any(membership as any, ORG('organization'))
     if (organization) {
       orgNameGiven = store.anyJS(organization as any, ns.schema('name'))
       orgHomePage = store.any(organization as any, ns.schema('uri'))
       publicId = store.any(organization as any, ns.solid('publicId'))
     }
     if (publicId) {
       publicIdName = store.anyJS(publicId as any, ns.schema('name'))
     }
     const orgName =  publicIdName || orgNameGiven

     const dates = startDate ? '(' + startDate.value.slice(0,4) + '-' +
       ( endDate ? endDate.value.slice(0,4) : '') +')'
       : ''
     const escoRole =  store.any(membership as any, ORG('role'))
     if (escoRole) {
       roleName =  store.anyJS(escoRole as any, ns.schema('name')) as string | null
     }
     const roleText0 = store.anyJS(membership as any, ns.vcard('role'))
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

  const skills = store.each(subject, ns.schema('skills')).map(sk => {
    if (sk.termType === 'Literal') return sk.value // Not normal but allow this
    const publicId =  store.anyJS(sk as any, ns.solid('publicId'))
    if (publicId) {
      const name = store.anyJS(publicId, ns.schema('name'))
      if (name) return name // @@ check language and get name in diff language if necessary
    }
    const manual = store.anyJS(sk as any, ns.vcard('role'))
    if (manual) return manual
    return '¿¿¿ skill ???'
  })

  return { rolesByType, skills }
}
