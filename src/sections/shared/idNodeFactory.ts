import { NamedNode, sym } from 'rdflib'

const ID_MIN = 1000000000000
const ID_MAX = 9999999999999

export function createIdNode(doc: NamedNode): NamedNode {
  const randomId = Math.floor(Math.random() * (ID_MAX - ID_MIN + 1)) + ID_MIN
  return sym(`${doc.uri}#id${randomId}`) as NamedNode
}
