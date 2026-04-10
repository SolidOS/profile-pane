import { Collection, LiveStore, NamedNode, Node, st, literal, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { SocialMutationPlan, SocialRow } from './types'
import { MutationOps } from '../shared/types'
import { createIdNode } from '../shared/idNodeFactory'
import {
	applyUpdaterPatch,
	collectNodeStatements,
	findExistingNode
} from '../shared/rdfMutationHelpers'
import { saveSocialUpdatesFailedPrefixText } from '../../texts'
import { findSocialAccountOption, getSocialAccountOptions } from './helpers'
import { presentSocial } from './selectors'
import { expandRdfList } from '../shared/rdfList'

function toObjectNode(value?: string): Node | null {
	const normalized = (value || '').trim()
	if (!normalized) return null
	if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
		return sym(normalized)
	}
	return literal(normalized)
}

function normalizeValue(value?: string): string {
	return (value || '').trim()
}

function toAccountNameFromHomepage(homepage: string, profilePrefix?: string): string {
	const homepageValue = normalizeValue(homepage)
	if (!homepageValue) return ''

	const prefixValue = normalizeValue(profilePrefix)
	if (prefixValue) {
		let trimmed = homepageValue
		const lowerPrefix = prefixValue.toLowerCase()
		while (trimmed.toLowerCase().startsWith(lowerPrefix)) {
			trimmed = trimmed.slice(prefixValue.length)
		}
		if (trimmed) return trimmed
	}

	return homepageValue
		.replace(/^https?:\/\//i, '')
		.replace(/^www\./i, '')
}

function buildSocialStatements(
	doc: NamedNode,
	node: NamedNode,
	row: SocialRow,
	accountOption?: { classUri: string, label: string, icon: string, userProfilePrefix?: string }
) {
	const inserts: any[] = []
	if (accountOption?.classUri) {
		inserts.push(st(node as any, ns.rdf('type'), sym(accountOption.classUri), doc))
	}

	const normalizedName = normalizeValue(row.name)
	const isOther = normalizedName.toLowerCase() === 'other' || accountOption?.classUri?.endsWith('#OtherAccount')

	if (isOther) {
		const homepageNode = toObjectNode(row.homepage)
		const iconNode = toObjectNode(row.icon)
		if (homepageNode) inserts.push(st(node as any, ns.foaf('homepage'), homepageNode as any, doc))
		if (iconNode) inserts.push(st(node as any, ns.foaf('icon'), iconNode as any, doc))
		if (normalizedName && normalizedName.toLowerCase() !== 'other') {
			inserts.push(st(node as any, ns.rdfs('label'), literal(normalizedName), doc))
		}
		return inserts
	}

	const accountName = toAccountNameFromHomepage(normalizeValue(row.homepage), accountOption?.userProfilePrefix)
	if (accountName) {
		inserts.push(st(node as any, ns.foaf('accountName'), literal(accountName), doc))
	}

	return inserts
}

function statementKey(statement: any): string {
	return `${statement.subject?.toNT?.() || statement.subject?.value} ${statement.predicate?.toNT?.() || statement.predicate?.value} ${statement.object?.toNT?.() || statement.object?.value} ${statement.why?.toNT?.() || statement.why?.value}`
}

function uniqueStatements(statements: any[]): any[] {
	return Array.from(new Map((statements || []).map((statement) => [statementKey(statement), statement])).values())
}

function collectListChainNodes(store: LiveStore, listHead: Node, doc: NamedNode): Node[] {
	if (!store.any(listHead as any, ns.rdf('first'), null, doc)) return []

	const visited = new Set<string>()
	const nodes: Node[] = []
	let current: Node | null = listHead

	while (current) {
		const key = `${current.termType}:${current.value}`
		if (visited.has(key)) break
		visited.add(key)
		nodes.push(current)

		const rest = store.any(current as any, ns.rdf('rest'), null, doc) as Node | null
		if (!rest || (rest.termType === 'NamedNode' && rest.value === ns.rdf('nil').value)) {
			break
		}
		current = rest
	}

	return nodes
}

function mergeSocialOps(existingRows: SocialRow[], socialOps: MutationOps<SocialRow>): SocialRow[] {
	const removeKeys = new Set(
		socialOps.remove
			.map((row) => normalizeValue(row.entryNode))
			.filter(Boolean)
	)

	const updateByKey = new Map(
		socialOps.update
			.map((row) => [normalizeValue(row.entryNode), row] as const)
			.filter(([key]) => Boolean(key))
	)

	const mergedExisting = existingRows
		.filter((row) => !removeKeys.has(normalizeValue(row.entryNode)))
		.map((row) => {
			const key = normalizeValue(row.entryNode)
			return updateByKey.get(key) || row
		})

	const creates = socialOps.create.filter((row) => {
		return Boolean(normalizeValue(row.name) || normalizeValue(row.homepage) || normalizeValue(row.icon))
	})

	return [...mergedExisting, ...creates]
}

async function mutateSocialEntries(store: LiveStore, subject: NamedNode, socialOps: MutationOps<SocialRow>) {
	const doc = subject.doc()
	const accountOptions = getSocialAccountOptions(store)
	const optionForRow = (row: SocialRow) => findSocialAccountOption(accountOptions, normalizeValue(row.name))

	const existingRows: SocialRow[] = presentSocial(subject, store).accounts.map((account) => ({
		name: normalizeValue(account.name),
		icon: normalizeValue(account.icon),
		homepage: normalizeValue(account.homepage),
		entryNode: account.entryNode.value,
		status: 'existing'
	}))

	const nextRows = mergeSocialOps(existingRows, socialOps)

	const accountObjects = store.each(subject, ns.foaf('account'), null, doc)
	const existingListNodes = uniqueStatements(
		accountObjects.flatMap((objectNode) => {
			return collectListChainNodes(store, objectNode, doc)
				.flatMap((node) => store.statementsMatching(node as any, null, null, doc))
		})
	)

	const existingAccountNodes = Array.from(new Map(
		accountObjects
			.flatMap((objectNode) => expandRdfList(store, objectNode))
			.filter((node) => node.termType === 'NamedNode')
			.map((node) => [`${node.termType}:${node.value}`, node as NamedNode])
	).values())

	const rowEntryNodes = nextRows.map((row) => {
		if (normalizeValue(row.entryNode)) {
			const existing = findExistingNode(existingAccountNodes as Node[], row.entryNode)
			if (existing && existing.termType === 'NamedNode') return existing as NamedNode
		}
		return createIdNode(doc)
	})

	const insertions: any[] = []
	if (rowEntryNodes.length > 0) {
		for (let size = rowEntryNodes.length; size >= 1; size -= 1) {
			insertions.push(st(subject, ns.foaf('account'), new Collection(rowEntryNodes.slice(0, size) as any) as any, doc))
		}
	}

	nextRows.forEach((row, index) => {
		insertions.push(...buildSocialStatements(doc, rowEntryNodes[index], row, optionForRow(row)))
	})

	const deletions = uniqueStatements([
		...store.statementsMatching(subject, ns.foaf('account'), null, doc),
		...existingListNodes,
		...existingAccountNodes.flatMap((node) => collectNodeStatements(store, node, doc))
	])

	await applyUpdaterPatch(store, deletions, uniqueStatements(insertions))
}

export async function processSocialMutations(store: LiveStore, subject: NamedNode, mutationPlan: SocialMutationPlan) {
	try {
		await mutateSocialEntries(store, subject, mutationPlan)
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		throw new Error(`${saveSocialUpdatesFailedPrefixText} ${message}`)
	}
}
