import { LiveStore, NamedNode, Node, st, literal, sym } from "rdflib"
import { ns } from "solid-ui"
import { ResumeRow } from "./types"
import { MutationOps } from "../shared/types"
import { applyUpdaterPatch, collectNodeStatements, findExistingNode } from "../shared/rdfMutationHelpers"
import { mutationSaveResumeFailedPrefixText, resumeUpdateEntryNotFoundErrorMessageText } from "../../texts"


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
    const organizationNode = store.bnode()
    inserts.push(st(node as any, ns.org('organization'), organizationNode, doc))

    if (resumeData.orgName) {
      inserts.push(st(organizationNode, ns.schema('name'), literal(resumeData.orgName), doc))
    }
    if (resumeData.orgType) {
      inserts.push(st(organizationNode, ns.org('classification'), literal(resumeData.orgType), doc))
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
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return sym(`${doc.value}#resume-${suffix}`)
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
