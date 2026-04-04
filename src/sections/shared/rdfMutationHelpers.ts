import { LiveStore, NamedNode, Node } from "rdflib"
import { fallbackSaveUpdatesErrorMessageText, updaterUnsupportedStoreErrorMessageText } from "../../texts"

function normalizeNodeId(value: string): string {
  return value.startsWith("_:") ? value.slice(2) : value
}

export function applyUpdaterPatch(store: LiveStore, deletions: any[], insertions: any[]) {
  if (!store.updater) {
    throw new Error(updaterUnsupportedStoreErrorMessageText)
  }

  const safeDeletions = (deletions || []).filter((statement: any) => {
    if (!statement || !statement.subject || !statement.predicate || !statement.object) return false
    const graph = statement.why
    return store.holds(statement.subject, statement.predicate, statement.object, graph)
  })

  const safeInsertions = (insertions || []).filter((statement: any) => {
    return Boolean(statement && statement.subject && statement.predicate && statement.object)
  })

  if (safeDeletions.length === 0 && safeInsertions.length === 0) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    try {
      ;(store.updater as any).update(
        safeDeletions as any,
        safeInsertions as any,
        (_uri: string, ok: boolean, message?: string) => {
          if (ok === true) {
            resolve()
            return
          }
          reject(new Error(message || fallbackSaveUpdatesErrorMessageText))
        }
      )
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)))
    }
  })
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
  const normalizedEntryNode = normalizeNodeId(entryNode)
  return nodes.find((node) => {
    const nodeValue = normalizeNodeId(node.value)
    if (nodeValue === normalizedEntryNode) return true
    return node.value === entryNode
  })
}
