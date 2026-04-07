import { LiveStore, NamedNode, Node, Store } from 'rdflib'
import { ns } from 'solid-ui'


export function skillAsText (store: Store, sk: Node):string {
  if (sk.termType === 'Literal') return ''
  const publicId =  store.anyJS(sk as NamedNode, ns.solid('publicId'))
  if (publicId) {
    const name = store.anyJS(publicId, ns.schema('name'))
    if (name) return name // @@ check language and get name in diff language if necessary
  }
  return ''
}

export function presentSkills(subject: NamedNode, store: LiveStore): string[] {
  return store
    .each(subject, ns.schema('skills'))
    .map((sk) => skillAsText(store, sk))
    .filter((skill) => skill !== '')
}
