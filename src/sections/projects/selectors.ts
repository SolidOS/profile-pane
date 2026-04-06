import { LiveStore, NamedNode, Node } from 'rdflib'
import { ns } from 'solid-ui'
import { projectType, ProjectDetails } from './types'


/* This code is AI generated from Model: GPT-5.3-Codex */
/* Prompt: I need to store Project data only the url of the project how
   should I store it please generate the code. Follow other sections */
function isProjectEntry(store: LiveStore, node: Node, doc: NamedNode): boolean {
  return store.holds(node as any, ns.rdf('type'), projectType, doc as any)
}

function projectNodeToUrl(node: Node): string {
  if (!node) return ''
  if ((node as any).termType === 'NamedNode') return (node as any).value || ''
  if ((node as any).termType === 'Literal') return (node as any).value || ''
  return ''
}

function normalizeCategory(value?: string): 'project' | 'community' | 'unknown' {
  const text = (value || '').trim().toLowerCase()
  if (text === 'project') return 'project'
  if (text === 'community') return 'community'
  return 'unknown'
}

export function presentProjects(subject: NamedNode, store: LiveStore): ProjectDetails[] {
  const doc = subject.doc()

  return store
    .each(subject, ns.schema('memberOf'), null, doc)
    .filter((membershipNode) => isProjectEntry(store, membershipNode as Node, doc))
    .map((membershipNode) => {
      const entryNode = membershipNode as unknown as Node
      const urlNode = store.any(membershipNode as NamedNode, ns.schema('url'), null, doc) as Node | null
      const imageNode = store.any(membershipNode as NamedNode, ns.schema('image'), null, doc) as Node | null
      const url = urlNode ? projectNodeToUrl(urlNode) : ''
      const title = (store.anyJS(membershipNode as NamedNode, ns.schema('name'), null, doc) as string | null) || undefined
      const businessType = (store.anyJS(membershipNode as NamedNode, ns.schema('industry'), null, doc) as string | null) || undefined
      const description = (store.anyJS(membershipNode as NamedNode, ns.schema('description'), null, doc) as string | null) || undefined
      const categoryRaw = (store.anyJS(membershipNode as NamedNode, ns.schema('additionalType'), null, doc) as string | null) || undefined
      const imageUrl = imageNode ? projectNodeToUrl(imageNode) : undefined

      return {
        url,
        title,
        businessType,
        description,
        imageUrl,
        category: normalizeCategory(categoryRaw),
        entryNode
      } as ProjectDetails
    })
    .filter((project) => project.url !== '')
}
