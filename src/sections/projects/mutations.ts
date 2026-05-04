import { LiveStore, NamedNode, st, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { ProjectMutationPlan, ProjectRow } from './types'
import { MutationOps, RdfStatement } from '../shared/types'
import { runUpdateTransport } from '../shared/rdfMutationHelpers'

function toProjectUrlNode(project: ProjectRow): NamedNode | null {
	const value = (project.url || '').trim()
	if (!value) return null
	try {
		return sym(new URL(value).href)
	} catch {
		return null
	}
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

async function mutateProjectEntries(store: LiveStore, subject: NamedNode, projectOps: MutationOps<ProjectRow>) {
	const doc = subject.doc()
	const existingLinks = store.each(subject, ns.solid('community'), null, doc)
	const existingByUrl = new Map<string, NamedNode>()
	existingLinks.forEach((linkNode) => {
		if (!linkNode || linkNode.termType !== 'NamedNode') return
		const key = normalizeProjectUrlKey(linkNode.value)
		if (key && !existingByUrl.has(key)) {
			existingByUrl.set(key, linkNode as NamedNode)
		}
	})

	const deletions: RdfStatement[] = []
	const insertions: RdfStatement[] = []
	const removeLink = (link: NamedNode) => {
		deletions.push(st(subject, ns.solid('community'), link, doc))
	}
	const addLink = (link: NamedNode) => {
		insertions.push(st(subject, ns.solid('community'), link, doc))
	}

	projectOps.remove.forEach((project) => {
		const entryKey = normalizeProjectUrlKey(project.entryNode || '')
		const urlKey = normalizeProjectUrlKey(project.url)
		const existing = (entryKey && existingByUrl.get(entryKey)) || (urlKey && existingByUrl.get(urlKey))
		if (existing) removeLink(existing)
	})

	projectOps.update.forEach((project) => {
		const newLink = toProjectUrlNode(project)
		const urlKey = normalizeProjectUrlKey(project.url)
		const entryKey = normalizeProjectUrlKey(project.entryNode || '')
		const existing = (entryKey && existingByUrl.get(entryKey)) || (urlKey && existingByUrl.get(urlKey))
		if (existing) removeLink(existing)
		if (newLink) addLink(newLink)
	})

	const seenCreateUrlKeys = new Set<string>()
	projectOps.create.forEach((project) => {
		const urlKey = normalizeProjectUrlKey(project.url)
		if (urlKey && (existingByUrl.has(urlKey) || seenCreateUrlKeys.has(urlKey))) {
			return
		}
		const newLink = toProjectUrlNode(project)
		if (!newLink) return
		addLink(newLink)
		if (urlKey) {
			seenCreateUrlKeys.add(urlKey)
		}
	})

	await runUpdateTransport(store, doc, deletions, insertions, {
		unsupportedMessage: 'Project updates are not supported by this store updater.',
		failureMessage: 'Failed to save projects',
		useDavFallback: true,
		usePutFallback: true
	})
}

export async function processProjectsMutations(store: LiveStore, subject: NamedNode, mutationPlan: ProjectMutationPlan) {
	try {
		await mutateProjectEntries(store, subject, mutationPlan)
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		throw new Error(`Failed to save projects: ${message}`)
	}
}
