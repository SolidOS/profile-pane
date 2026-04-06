import { LiveStore, NamedNode, Node, st, literal, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { SocialMutationPlan, SocialRow } from './types'
import { MutationOps } from '../shared/types'
import {
	applyUpdaterPatch,
	collectLinkStatements,
	collectNodeStatements,
	findExistingNode
} from '../shared/rdfMutationHelpers'
import { saveSocialUpdatesFailedPrefixText } from '../../texts'

function toObjectNode(value?: string): Node | null {
	const normalized = (value || '').trim()
	if (!normalized) return null
	if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
		return sym(normalized)
	}
	return literal(normalized)
}

function buildSocialStatements(subject: NamedNode, doc: NamedNode, node: Node, row: SocialRow) {
	const inserts: any[] = [st(subject, ns.foaf('account'), node as any, doc)]

	const nameNode = toObjectNode(row.name)
	const iconNode = toObjectNode(row.icon)
	const homepageNode = toObjectNode(row.homepage)

	if (nameNode) inserts.push(st(node as any, ns.foaf('name'), nameNode as any, doc))
	if (iconNode) inserts.push(st(node as any, ns.foaf('icon'), iconNode as any, doc))
	if (homepageNode) inserts.push(st(node as any, ns.foaf('homepage'), homepageNode as any, doc))

	return inserts
}

async function mutateSocialEntries(store: LiveStore, subject: NamedNode, socialOps: MutationOps<SocialRow>) {
	const doc = subject.doc()
	const existingSocialNodes = store.each(subject, ns.foaf('account'), null, doc) as Node[]
	const deletions: any[] = []
	const insertions: any[] = []

	socialOps.remove.forEach((row) => {
		if (!row.entryNode) return
		const existingNode = findExistingNode(existingSocialNodes, row.entryNode)
		if (existingNode) {
			deletions.push(...collectLinkStatements(store, subject, ns.foaf('account'), existingNode, doc))
			deletions.push(...collectNodeStatements(store, existingNode, doc))
		}
	})

	socialOps.update.forEach((row) => {
		if (!row.entryNode) return
		const existingNode = findExistingNode(existingSocialNodes, row.entryNode)
		if (existingNode) {
			deletions.push(...collectNodeStatements(store, existingNode, doc))
			insertions.push(...buildSocialStatements(subject, doc, existingNode, row))
		}
	})

	socialOps.create.forEach((row) => {
		const entryNode = toObjectNode(row.homepage)
		if (entryNode && entryNode.termType === 'NamedNode') {
			insertions.push(...buildSocialStatements(subject, doc, entryNode, row))
		}
	})

	await applyUpdaterPatch(store, deletions, insertions)
}

export async function processSocialMutations(store: LiveStore, subject: NamedNode, mutationPlan: SocialMutationPlan) {
	try {
		await mutateSocialEntries(store, subject, mutationPlan)
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		throw new Error(`${saveSocialUpdatesFailedPrefixText} ${message}`)
	}
}
