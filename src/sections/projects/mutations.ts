import { LiveStore, NamedNode, Node, st, sym, literal } from "rdflib"
import { ns } from "solid-ui"
import { ProjectMutationPlan, ProjectRow, projectType } from "./types"
import { MutationOps } from "../shared/types"
import { applyUpdaterPatch, collectLinkStatements, collectNodeStatements, findExistingNode } from "../shared/rdfMutationHelpers"

/* This code is AI generated from Model: GPT-5.3-Codex */
/* Prompt: I need to store Project data only the url of the project how
   should I store it please generate the code. Follow other sections */
function toProjectUrlNode(project: ProjectRow): NamedNode | null {
	const value = (project.url || '').trim()
	if (!value) return null
	return sym(value)
}

function normalizeProjectUrlKey(value: string): string {
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

function readNodeUrlValue(node: Node | null | undefined): string {
	if (!node) return ''
	if ((node as any).termType === 'NamedNode' || (node as any).termType === 'Literal') {
		return ((node as any).value || '').trim()
	}
	return ''
}

function buildProjectStatements(subject: NamedNode, doc: NamedNode, projectNode: any, project: ProjectRow) {
	const projectUrlNode = toProjectUrlNode(project)
	if (!projectUrlNode) return []

	const inserts: any[] = [
		st(subject, ns.schema('memberOf'), projectNode, doc),
		st(projectNode as any, ns.rdf('type'), projectType, doc),
		st(projectNode as any, ns.schema('url'), projectUrlNode, doc)
	]

	if (project.title) {
		inserts.push(st(projectNode as any, ns.schema('name'), literal(project.title), doc))
	}

	if (project.businessType) {
		inserts.push(st(projectNode as any, ns.schema('industry'), literal(project.businessType), doc))
	}

	if (project.description) {
		inserts.push(st(projectNode as any, ns.schema('description'), literal(project.description), doc))
	}

	if (project.imageUrl) {
		const imageValue = project.imageUrl.trim()
		if (imageValue.startsWith('http://') || imageValue.startsWith('https://')) {
			inserts.push(st(projectNode as any, ns.schema('image'), sym(imageValue), doc))
		} else {
			inserts.push(st(projectNode as any, ns.schema('image'), literal(imageValue), doc))
		}
	}

	if (project.category && project.category !== 'unknown') {
		inserts.push(st(projectNode as any, ns.schema('additionalType'), literal(project.category), doc))
	}

	return inserts
}

async function mutateProjectEntries(store: LiveStore, subject: NamedNode, projectOps: MutationOps<ProjectRow>) {
	const doc = subject.doc()
	const existingProjectNodes = store
		.each(subject, ns.schema('memberOf'), null, doc)
		.filter((node) => store.holds(node as any, ns.rdf('type'), projectType, doc as any))

	const existingByUrl = new Map<string, Node>()
	existingProjectNodes.forEach((projectNode) => {
		const urlNode = store.any(projectNode as NamedNode, ns.schema('url'), null, doc) as Node | null
		const key = normalizeProjectUrlKey(readNodeUrlValue(urlNode))
		if (key && !existingByUrl.has(key)) {
			existingByUrl.set(key, projectNode as Node)
		}
	})

	const deletions: any[] = []
	const insertions: any[] = []

	projectOps.remove.forEach((project) => {
		if (!project.entryNode) return
		const existingNode = findExistingNode(existingProjectNodes, project.entryNode)
		if (existingNode) {
			deletions.push(...collectLinkStatements(store, subject, ns.schema('memberOf'), existingNode, doc))
			if ((existingNode as any).termType !== 'Literal') {
				deletions.push(...collectNodeStatements(store, existingNode as any, doc))
			}
		}
	})

	projectOps.update.forEach((project) => {
		const urlKey = normalizeProjectUrlKey(project.url)
		const existingNode = project.entryNode
			? findExistingNode(existingProjectNodes, project.entryNode) || (urlKey ? existingByUrl.get(urlKey) : undefined)
			: (urlKey ? existingByUrl.get(urlKey) : undefined)
		if (existingNode) {
			deletions.push(...collectLinkStatements(store, subject, ns.schema('memberOf'), existingNode, doc))
			if ((existingNode as any).termType !== 'Literal') {
				deletions.push(...collectNodeStatements(store, existingNode as any, doc))
			}
			insertions.push(...buildProjectStatements(subject, doc, existingNode as Node, project))
			return
		}

		if (urlKey && existingByUrl.has(urlKey)) {
			return
		}

		insertions.push(...buildProjectStatements(subject, doc, store.bnode() as Node, project))
		if (urlKey) {
			existingByUrl.set(urlKey, store.bnode() as Node)
		}
	})

	const seenCreateUrlKeys = new Set<string>()
	projectOps.create.forEach((project) => {
		const urlKey = normalizeProjectUrlKey(project.url)
		if (urlKey && (existingByUrl.has(urlKey) || seenCreateUrlKeys.has(urlKey))) {
			return
		}
		insertions.push(...buildProjectStatements(subject, doc, store.bnode() as Node, project))
		if (urlKey) {
			seenCreateUrlKeys.add(urlKey)
		}
	})

	await applyUpdaterPatch(store, deletions, insertions)
}

export async function processProjectsMutations(store: LiveStore, subject: NamedNode, mutationPlan: ProjectMutationPlan) {
	try {
		await mutateProjectEntries(store, subject, mutationPlan)
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		throw new Error(`Failed to save projects: ${message}`)
	}
}
