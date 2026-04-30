import { LiveStore, NamedNode, st, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { ProjectMutationPlan, ProjectRow } from './types'
import { MutationOps, RdfStatement, RdfUpdater } from '../shared/types'
import { applyStatementsToStore, sanitizePatchStatements, statementKey } from '../shared/rdfMutationHelpers'

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

function isPatchFailure(message: string): boolean {
	const text = (message || '').toLowerCase()
	return (
		text.includes('fetch error for patch') ||
		text.includes('failed to fetch') ||
		text.includes(' on patch ') ||
		text.includes('web error: 500') ||
		text.includes('web error: 501') ||
		text.includes('web error: 405') ||
		text.includes('web error: 400')
	)
}

function isMissingGetRecordError(message: string): boolean {
	return (message || '').toLowerCase().includes('no record of our http get request for document')
}

async function runPutFallback(store: LiveStore, doc: NamedNode, deletions: RdfStatement[], insertions: RdfStatement[]) {
	const updater = store.updater as RdfUpdater | undefined
	const fetcher = store.fetcher as { webOperation?: (...args: unknown[]) => Promise<{ ok?: boolean; status?: number }> } | undefined

	if (!updater || typeof updater.serialize !== 'function' || !fetcher || typeof fetcher.webOperation !== 'function') {
		throw new Error('Project updates are not supported by this store updater.')
	}

	const currentStatements = store.statementsMatching(undefined, undefined, undefined, doc).slice()
	const deletionKeys = new Set((deletions || []).map((statement) => statementKey(statement)))
	const nextStatements = currentStatements.filter((statement) => !deletionKeys.has(statementKey(statement))).concat(insertions || [])

	const contentType = 'text/turtle'
	const body = updater.serialize(doc.value, nextStatements, contentType)
	const response = await fetcher.webOperation('PUT', doc.value, {
		noMeta: true,
		contentType,
		body
	})

	if (!response || response.ok !== true) {
		const status = response?.status || 'unknown'
		throw new Error(`Web error: ${status} on PUT of <${doc.value}>`)
	}

	applyStatementsToStore(store, deletions, insertions)
}

async function runUpdateWithDavFallback(store: LiveStore, doc: NamedNode, deletions: RdfStatement[], insertions: RdfStatement[]) {
	const updater = store.updater as RdfUpdater | undefined
	if (!updater || typeof updater.update !== 'function') {
		throw new Error('Project updates are not supported by this store updater.')
	}

	const { safeDeletions, safeInsertions } = sanitizePatchStatements(store, deletions, insertions)
	if (safeDeletions.length === 0 && safeInsertions.length === 0) {
		return
	}

	const tryUpdate = () => new Promise<void>((resolve, reject) => {
		updater.update(safeDeletions, safeInsertions, (_uri: string, ok: boolean, message?: string) => {
			if (ok === true) {
				resolve()
				return
			}
			reject(new Error(message || 'Failed to save projects'))
		})
	})

	try {
		await tryUpdate()
		return
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		if (!isPatchFailure(message) || typeof updater.updateDav !== 'function') {
			throw error
		}

		if (store.fetcher?.load) {
			try {
				await store.fetcher.load(doc)
			} catch {
				// continue to fallback
			}
		}

		try {
			await new Promise<void>((resolve, reject) => {
				updater.updateDav(doc, safeDeletions, safeInsertions, (_uri: string, ok: boolean, body?: string) => {
					if (ok === true) {
						resolve()
						return
					}
					reject(new Error(body || message || 'Failed to save projects'))
				})
			})
		} catch (davError) {
			const davMessage = davError instanceof Error ? davError.message : String(davError)
			if (!isMissingGetRecordError(davMessage)) {
				throw davError
			}
			await runPutFallback(store, doc, safeDeletions, safeInsertions)
		}
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

	await runUpdateWithDavFallback(store, doc, deletions, insertions)
}

export async function processProjectsMutations(store: LiveStore, subject: NamedNode, mutationPlan: ProjectMutationPlan) {
	try {
		await mutateProjectEntries(store, subject, mutationPlan)
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		throw new Error(`Failed to save projects: ${message}`)
	}
}
