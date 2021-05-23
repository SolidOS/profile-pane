import { IndexedFormula, NamedNode } from "rdflib";
import { ns, utils, language } from "solid-ui";
import { findImage } from "solid-ui/lib/widgets/buttons";
import Node from "rdflib/src/node-internal";
import { validateHTMLColorHex } from "validate-color";

export interface Role {
  startDate?: Date,

}
export interface CVPresentation {
  pastRoles: Role[];
  currentRoles: Role[];
  futureRoles: Role[]
}

export const presentCV = (
  subject: NamedNode,
  store: IndexedFormula
): CVPresentation => {
  const profile = subject.doc()

  const pastRoles = []
  const currentRoles = []
  const futureRoles = []

 const memberships = store.each(null, ns.org('member'), subject, profile)

 const typesOfRole = ['PastRole', 'CurrentRole', 'FutureRole']
 let rolesByType = []
 for (t of typesOfRole) {
   rolesByType[t] = []
 }
 const now = new Date()

 for (const membership of memberships) {
   let item = {}
   if (store.holds(membership, ns.rdf('type'), ns.solid('PastRole'), profile) {
     item.endDate = store.any(membership, ns.schema('startDate'), null, profile)
   }
   item.endDate = item.endDate || now
   for (t of typesOfRole) {
     if (store.holds(membership, ns.rdf('type'), ns.solid('PastRole'), profile)) {
        rolesByType[t].push(item)
     }
   }
   // Things should have start dates but we will be very lenient in this view
   item.startDate = store.any(membership, ns.schema('startDate'), null, profile) || now
   let publicId = store.any(membership, ns.solid('publicId'), null, profile)
   let organization = store.any(membership, ns.org('organization'), null, profile)
   if (organization) {
     item.orgName = store.anyJS(organization , ns.schema('name'), null, profile)
     item.orgHomePage = store.any(organization , ns.schema('uri'), null, profile)
   }
   if (publicId) {
     publicIdName = store.anyJS(publicId , ns.schema('name'), null, profile)
   }
   item.name =  publicIdName || item.orgName
   item.dates = item.startDate ? '(' + item.startDate.value.slice(0,4) + '-' + (
     item.endDate ? item.endDate.value.slice(0,4) : ''
   ) : ''
   let escoRole =  store.any(membership, ns.org('role'), null, profile)
   if (escoRole) {
     item.roleName =  store.anyJS(escoRole, ns.org('role'), null, profile)
   }
   let textRole = store.anyJS(membership, ns.schema('startDate'), null, profile)
   item.roleText = (textRole && item.roleName) ? item.roleName + ' - ' + textRole
      : textRole || item.roleName

 }
 // Most recent thing most relevant -> sort by end date
 for (t of typesOfRole) {
   rolesByType[t].sort(function (x, y) {
     if (x.endDate && y.endDate) {
       return x.endDate > y.endDate ? -1 : 1
     }
     return x.startDate > y.startDate ? -1 : 1
   })
 }

  return {
    pastRoles,
    currentRoles,
    futureRoles
  }
}
