import { LiveStore, NamedNode, Literal, Namespace, Node, Store } from 'rdflib'
import { ns, utils } from 'solid-ui'

export interface Role {
  startDate?: Literal,
  endDate: Literal,
  dates: string,
  orgName: string,
  roleText: string,
  orgHomePage?: string
}
export interface CVPresentation { 
  rolesByType: RolesByType;
  skills: string[];
  languages: string[];
}

export interface RolesByType {
  PastRole: Role[];
  CurrentRole: Role[];
  FutureRole: Role[];
}

const ORG = Namespace('http://www.w3.org/ns/org#')

export const typesOfRole = ['PastRole', 'CurrentRole', 'FutureRole']

export function skillAsText (store: Store, sk: Node):string {
  if (sk.termType === 'Literal') return sk.value // Not normal but allow this
  const publicId =  store.anyJS(sk as NamedNode, ns.solid('publicId'))
  if (publicId) {
    const name = store.anyJS(publicId, ns.schema('name'))
    if (name) return name // @@ check language and get name in diff language if necessary
  }

  const manual = store.anyJS(sk as NamedNode, ns.vcard('role'))
  if (manual && manual[0] > '') return manual
  return ''
}

export function languageAsText (store: Store, lan: Node):string {
  if (lan.termType === 'Literal') return lan.value // Not normal but allow this
  const publicId = store.anyJS(lan as NamedNode, ns.solid('publicId'))
  if (publicId)
    return utils.label(publicId, true) // @@ check language and get name in diff language if necessary
  return ''                                                  
}

export function datesAsText (startDate?:Literal, endDate?:Literal):string {
  return startDate ? '(' + startDate.value.slice(0,10) + ' to ' +
    ( endDate ? endDate.value.slice(0,10) : '') +')'
    : ''                                
}

function expandRdfList(store: Store, node: Node): Node[] {
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

function getRolesByType(
  store: LiveStore,
  subject: NamedNode
): RolesByType {

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
   return rolesByType
}

export function presentCV(
  subject: NamedNode,
  store: LiveStore
): CVPresentation {
  
 const rolesByType = getRolesByType(store, subject)
 // Most recent thing most relevant -> sort by end date
 for (const t of typesOfRole) {
   rolesByType[t].sort(function (x, y) {
     if (x.endDate && y.endDate) {
       return x.endDate > y.endDate ? -1 : 1
     }
     return x.startDate > y.startDate ? -1 : 1
   })
  }

  const skills = store
    .each(subject, ns.schema('skills'))
    .map((sk) => skillAsText(store, sk))
    .filter((skill) => skill !== '')

 const languageNodes = store.each(subject, ns.schema('knowsLanguage'))
  const languages = languageNodes
    .flatMap(node => expandRdfList(store, node))
    .map(lan => languageAsText(store, lan))
  // Deduplicate languages
  const uniqueLanguages = Array.from(new Set(languages))

  return { rolesByType, skills, languages: uniqueLanguages }
}
