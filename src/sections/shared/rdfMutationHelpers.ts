import { LiveStore, NamedNode, Node } from "rdflib"

export function applyUpdaterPatch(store: LiveStore, deletions: any[], insertions: any[]) {
  if (store.updater) {
    return store.updater.update(deletions as any, insertions as any)
  }
  throw new Error("Store does not support updates")
}

export function collectNodeStatements(store: LiveStore, node: Node, doc: NamedNode) {
  return store.statementsMatching(node as any, null, null, doc as any)
}

export function collectLinkStatements(
  store: LiveStore,
  subject: NamedNode,
  predicate: NamedNode,
  node: Node,
  doc: NamedNode
) {
  return store.statementsMatching(subject, predicate, node as any, doc)
}

export function findExistingNode(nodes: Node[], entryNode: string) {
  return nodes.find((node) => node.value === entryNode)
}
