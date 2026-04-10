import { NamedNode, sym } from 'rdflib'

export function createIdNode(doc: NamedNode): NamedNode {
  const timestampId = Date.now()
  return sym(`${doc.uri}#id${timestampId}`) as NamedNode
}
