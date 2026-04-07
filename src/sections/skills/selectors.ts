import { LiveStore, NamedNode, Node, Store } from 'rdflib'
import { ns, utils } from 'solid-ui'


export function skillAsText (store: Store, sk: Node):string {
  if (sk.termType === 'Literal') return ''
  const publicId = store.any(sk as NamedNode, ns.solid('publicId')) as Node | null
  if (publicId && publicId.termType === 'NamedNode') {
    const name = store.anyJS(publicId as NamedNode, ns.schema('name'))
    if (name) return name
    return utils.label(publicId, true)
  }
  return ''
}

export function presentSkills(subject: NamedNode, store: LiveStore): string[] {
  return store
    .each(subject, ns.schema('skills'))
    .map((sk) => skillAsText(store, sk))
    .filter((skill) => skill !== '')
}
