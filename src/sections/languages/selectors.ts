import { NamedNode, Store, Node, LiveStore } from 'rdflib'
import { ns } from 'solid-ui'
import { LanguageDetails } from './types'
import { expandRdfList } from '../shared/rdfList'

const IANA_LANGUAGE_BASE = 'https://www.w3.org/ns/iana/language-code/'

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function firstLiteralValue(store: Store, subject: NamedNode, predicate: NamedNode): string {
  const value = store.anyValue(subject, predicate)
  return typeof value === 'string' ? value : ''
}

function languageNameFromCode(code: string): string {
  const normalized = (code || '').trim().toLowerCase()
  if (!normalized) return ''

  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'language' })
    const localized = displayNames.of(normalized)
    if (localized) return localized
  } catch {
    // Fallback below.
  }

  return normalized
}

function languageNameFromPublicId(publicIdValue: string): string {
  const value = (publicIdValue || '').trim()
  if (!value) return ''

  if (value.startsWith(IANA_LANGUAGE_BASE)) {
    const code = value.slice(IANA_LANGUAGE_BASE.length)
    return languageNameFromCode(code)
  }

  return ''
}

function englishLabelForNode(store: Store, node: NamedNode): string {
  const labels = store.statementsMatching(node, ns.rdfs('label'))
  const english = labels.find((statement) => {
    const language = (statement.object as any)?.lang || ''
    return language.toLowerCase().startsWith('en')
  })
  if (english && english.object && typeof (english.object as any).value === 'string') {
    return (english.object as any).value
  }
  return ''
}

export function languageAsText (store: Store, lan: Node):string {
  if (lan.termType === 'Literal') return lan.value // Not normal but allow this

  const publicIdNode = store.any(lan as NamedNode, ns.solid('publicId'))
  if (publicIdNode && publicIdNode.termType === 'NamedNode') {
    const publicIdName = firstLiteralValue(store, publicIdNode as NamedNode, ns.schema('name'))
    if (publicIdName) {
      return normalizeText(publicIdName) || ''
    }

    const localLabel = englishLabelForNode(store, publicIdNode as NamedNode)
    if (localLabel) return localLabel

    return languageNameFromPublicId(publicIdNode.value)
  }

  return ''                                                  
}

export function presentLanguages(subject: NamedNode, store: LiveStore): LanguageDetails[] {
  const languageNodes = store.each(subject, ns.schema('knowsLanguage'))
  const details: LanguageDetails[] = languageNodes
    .flatMap(node => expandRdfList(store, node))
    .map((lan) => ({
      name: languageAsText(store, lan),
      publicId: store.any(lan as NamedNode, ns.solid('publicId'))?.value || undefined,
      proficiency: store.anyValue(lan as NamedNode, ns.schema('proficiencyLevel')) || undefined,
      entryNode: lan
    }))
    .filter((item) => Boolean(item.name))

  const dedupedByLanguage = new Map<string, LanguageDetails>()
  details.forEach((item) => {
    const key = item.publicId || item.name
    if (!dedupedByLanguage.has(key)) {
      dedupedByLanguage.set(key, item)
    }
  })

  return Array.from(dedupedByLanguage.values())
}
