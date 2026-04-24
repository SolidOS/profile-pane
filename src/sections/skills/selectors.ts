import { LiveStore, NamedNode, Node, Store } from 'rdflib'
import { ns, utils } from 'solid-ui'
import { SkillDetails } from './types'


export function skillAsText (store: Store, sk: Node):string {
  if (sk.termType === 'Literal') return ''

  const directName = store.anyJS(sk as NamedNode, ns.schema('name'))
  if (directName) return directName

  // Canonical shape: entry node -> solid:publicId -> schema:name.
  const publicId = store.any(sk as NamedNode, ns.solid('publicId')) as Node | null
  if (publicId && publicId.termType === 'NamedNode') {
    const name = store.anyJS(publicId as NamedNode, ns.schema('name'))
    if (name) return name
    return utils.label(publicId, true)
  }

  return ''
}

export function presentSkillDetails(subject: NamedNode, store: LiveStore): SkillDetails[] {
  return store
    .each(subject, ns.schema('skills'))
    .filter((sk) => sk.termType !== 'Literal')
    .map((sk) => {
      const publicId = store.any(sk as NamedNode, ns.solid('publicId')) as Node | null
      const publicIdUri = publicId ? publicId.value : ''
      return {
        name: skillAsText(store, sk),
        publicId: publicIdUri,
        entryNode: sk
      }
    })
    .filter((detail) => detail.name !== '')
}

export function presentSkills(subject: NamedNode, store: LiveStore): string[] {
  return presentSkillDetails(subject, store).map((detail) => detail.name)
}
