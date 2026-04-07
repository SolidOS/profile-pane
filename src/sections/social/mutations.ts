import { LiveStore, NamedNode, Node, st, literal, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { SocialMutationPlan, SocialRow } from './types'
import { MutationOps } from '../shared/types'
import { createIdNode } from '../shared/idNodeFactory'
import {
	applyUpdaterPatch,
	collectLinkStatements,
	collectNodeStatements,
	findExistingNode
} from '../shared/rdfMutationHelpers'
import { saveSocialUpdatesFailedPrefixText } from '../../texts'
import { getSocialAccountOptions } from './helpers'

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
	if (prefixValue && homepageValue.toLowerCase().startsWith(prefixValue.toLowerCase())) {
		return homepageValue.slice(prefixValue.length)
	}

	return homepageValue
		.replace(/^https?:\/\//i, '')
		.replace(/^www\./i, '')
}

function buildSocialStatements(
	subject: NamedNode,
	doc: NamedNode,
	node: NamedNode,
	row: SocialRow,
	accountOption?: { classUri: string, label: string, icon: string, userProfilePrefix?: string }
) {
	const inserts: any[] = [st(subject, ns.foaf('account'), node as any, doc)]
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

async function mutateSocialEntries(store: LiveStore, subject: NamedNode, socialOps: MutationOps<SocialRow>) {
	const doc = subject.doc()
	const accountOptions = getSocialAccountOptions(store)
	const optionByLabel = new Map(accountOptions.map((option) => [option.label.trim().toLowerCase(), option]))
	const optionForRow = (row: SocialRow) => optionByLabel.get(normalizeValue(row.name).toLowerCase())
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
		if (existingNode && existingNode.termType === 'NamedNode') {
			deletions.push(...collectNodeStatements(store, existingNode, doc))
			insertions.push(...buildSocialStatements(subject, doc, existingNode as NamedNode, row, optionForRow(row)))
		}
	})

	socialOps.create.forEach((row) => {
		insertions.push(...buildSocialStatements(subject, doc, createIdNode(doc), row, optionForRow(row)))
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
