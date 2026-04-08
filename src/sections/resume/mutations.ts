import { LiveStore, NamedNode, Node, st, literal, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { ResumeRow } from './types'
import { MutationOps } from '../shared/types'
import { applyUpdaterPatch, collectNodeStatements, findExistingNode } from '../shared/rdfMutationHelpers'
import { createIdNode } from '../shared/idNodeFactory'
import { mutationSaveResumeFailedPrefixText, resumeUpdateEntryNotFoundErrorMessageText } from '../../texts'

function membershipTypeForRole(resumeData: ResumeRow): NamedNode {
  if (resumeData.isCurrentRole) return ns.solid('CurrentRole')

  const todayIso = new Date().toISOString().slice(0, 10)
  const startIso = resumeData.startDate?.value?.slice(0, 10) || ''
  const endIso = resumeData.endDate?.value?.slice(0, 10) || ''

  if (startIso && startIso > todayIso) return ns.solid('FutureRole')
  if (endIso && endIso < todayIso) return ns.solid('PastRole')
  return ns.solid('FutureRole')
}

function organizationTypeNode(orgType: string): NamedNode | null {
  const text = (orgType || '').trim()
  if (!text) return null

  if (text.startsWith('http://') || text.startsWith('https://')) {
    return sym(text)
  }

  const prefixed = text.match(/^([a-zA-Z][\w-]*):(.*)$/)
  if (prefixed) {
    const prefix = prefixed[1].toLowerCase()
    const local = prefixed[2].trim()
    if (!local) return null
    if (prefix === 'schema') return ns.schema(local)
    if (prefix === 'vcard') return ns.vcard(local)
    if (prefix === 'solid') return ns.solid(local)
    if (prefix === 'org') return ns.org(local)
    return null
  }

  // For plain values like "Corporation", map to schema:Corporation.
  return ns.schema(text)
}


function buildResumeStatements(
  store: LiveStore,
  subject: NamedNode,
  doc: NamedNode,
  node: Node,
  resumeData: ResumeRow,
  includeMembershipLink = true
) {
  const inserts: any[] = []

  if (includeMembershipLink) {
    inserts.push(st(node as any, ns.org('member'), subject, doc))
  }

  inserts.push(st(node as any, ns.rdf('type'), membershipTypeForRole(resumeData), doc))

  if (resumeData.title) {
    inserts.push(st(node as any, ns.vcard('role'), literal(resumeData.title), doc))
  }
  if (resumeData.startDate) {
    inserts.push(st(node as any, ns.schema('startDate'), resumeData.startDate as any, doc))
  }
  if (resumeData.endDate && !resumeData.isCurrentRole) {
    inserts.push(st(node as any, ns.schema('endDate'), resumeData.endDate as any, doc))
  }
  if (resumeData.description) {
    inserts.push(st(node as any, ns.schema('description'), literal(resumeData.description), doc))
  }

  if (resumeData.orgName || resumeData.orgType || resumeData.orgLocation || resumeData.orgHomePage) {
    const organizationNode = createIdNode(doc)
    inserts.push(st(node as any, ns.org('organization'), organizationNode, doc))
    inserts.push(st(organizationNode, ns.rdf('type'), ns.vcard('Organization'), doc))

    const organizationClassNode = organizationTypeNode(resumeData.orgType || '')
    if (organizationClassNode) {
      inserts.push(st(organizationNode, ns.rdf('type'), organizationClassNode, doc))
    }

    if (resumeData.orgName) {
      inserts.push(st(organizationNode, ns.schema('name'), literal(resumeData.orgName), doc))
    }
    if (resumeData.orgLocation) {
      inserts.push(st(organizationNode, ns.org('location'), literal(resumeData.orgLocation), doc))
    }
    if (resumeData.orgHomePage) {
      inserts.push(st(organizationNode, ns.schema('uri'), literal(resumeData.orgHomePage), doc))
    }
  }

  return inserts
}

function mintResumeNode(doc: NamedNode): NamedNode {
  return createIdNode(doc)
}

async function mutateResumeEntries(store: LiveStore, subject: NamedNode, resumeOps: MutationOps<ResumeRow>) {
  const doc = subject.doc()
  const existingResumeNodes = store.each(null, ns.org('member'), subject, doc) as Node[]
  const deletions: any[] = []
  const insertions: any[] = []

  resumeOps.remove.forEach((resume) => {
    if (!resume.entryNode) return
    const existingNode = findExistingNode(existingResumeNodes, resume.entryNode)
    if (existingNode) {
      deletions.push(...collectNodeStatements(store, existingNode, doc))
    }
  })

  resumeOps.update.forEach((resume) => {
    if (!resume.entryNode) return
    const existingNode = findExistingNode(existingResumeNodes, resume.entryNode)
    if (!existingNode) {
      throw new Error(resumeUpdateEntryNotFoundErrorMessageText)
    }

    if ((existingNode as any).termType === 'BlankNode') {
      // Blank node labels are not always stable for remote updates; migrate to a named node.
      const migratedNode = mintResumeNode(doc)
      insertions.push(...buildResumeStatements(store, subject, doc, migratedNode, resume, true))
      return
    }

    // For updates on existing named memberships, keep the membership link and replace only mutable fields.
    deletions.push(...store.statementsMatching(existingNode as any, ns.rdf('type'), null, doc as any))
    deletions.push(...store.statementsMatching(existingNode as any, ns.vcard('role'), null, doc as any))
    deletions.push(...store.statementsMatching(existingNode as any, ns.schema('startDate'), null, doc as any))
    deletions.push(...store.statementsMatching(existingNode as any, ns.schema('endDate'), null, doc as any))
    deletions.push(...store.statementsMatching(existingNode as any, ns.schema('description'), null, doc as any))

    const existingOrganizations = store.each(existingNode as NamedNode, ns.org('organization'), null, doc) as Node[]
    existingOrganizations.forEach((organizationNode) => {
      deletions.push(...collectNodeStatements(store, organizationNode, doc))
    })
    deletions.push(...store.statementsMatching(existingNode as any, ns.org('organization'), null, doc as any))

    insertions.push(...buildResumeStatements(store, subject, doc, existingNode, resume, false))
  })

  resumeOps.create.forEach((resume) => {
    insertions.push(...buildResumeStatements(store, subject, doc, mintResumeNode(doc), resume))
  })

  await applyUpdaterPatch(store, deletions, insertions)
}

export type ResumeMutationPlan = MutationOps<ResumeRow>

export async function processResumeMutations(store: LiveStore, subject: NamedNode, mutationPlan: ResumeMutationPlan) {
  try {
    await mutateResumeEntries(store, subject, mutationPlan)

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${mutationSaveResumeFailedPrefixText} ${message}`)
  }
} 
