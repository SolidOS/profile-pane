import { LiveStore, NamedNode, Node } from 'rdflib'
import { ns } from 'solid-ui'
import { ProjectDetails } from './types'

function projectNodeToUrl(node: Node): string {
  if (!node) return ''
  if ((node as any).termType === 'NamedNode') return (node as any).value || ''
  if ((node as any).termType === 'Literal') return (node as any).value || ''
  return ''
}

function normalizeUrlKey(value: string): string {
  const text = (value || '').trim()
  if (!text) return ''
  try {
    const parsed = new URL(text)
    parsed.hash = ''
    return parsed.href
  } catch {
    return text
  }
}

export function presentProjects(subject: NamedNode, store: LiveStore): ProjectDetails[] {
  const doc = subject.doc()
  const seen = new Set<string>()

  return store
    .each(subject, ns.solid('community'), null, doc)
    .map((communityNode) => {
      const url = projectNodeToUrl(communityNode as Node)
      const key = normalizeUrlKey(url)
      if (!url || !key || seen.has(key)) return null
      seen.add(key)

      return {
        url,
        category: 'unknown',
        entryNode: communityNode as Node
      } as ProjectDetails
    })
    .filter((project): project is ProjectDetails => Boolean(project))
}
