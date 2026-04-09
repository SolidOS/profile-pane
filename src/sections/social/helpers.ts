import { LiveStore, NamedNode, sym } from 'rdflib'
import { ns, utils } from 'solid-ui'
import socialMediaForm from '../../ontology/socialMedia.ttl'
import { starIconAsset } from '../../icons-svg/profileIcons'
import { loadDocument } from '../../rdfFormsHelper'
import { expandRdfList } from '../shared/rdfList'
import { DEFAULT_ICON_URI, socialMediaFormName } from './constants'

const OWL_DISJOINT_UNION_OF = sym('http://www.w3.org/2002/07/owl#disjointUnionOf')
const STAR_ICON_REF = 'urn:profile-pane:starIcon'

function resolveSocialIcon(classUri: string, iconValue: string): string {
  if (classUri.endsWith('#OtherAccount') || iconValue === STAR_ICON_REF) {
    return starIconAsset
  }
  return iconValue || DEFAULT_ICON_URI
}

export type SocialAccountOption = {
  classUri: string
  label: string
  icon: string
  homepage?: string
  userProfilePrefix?: string
}

export function ensureSocialOntologyLoaded(store: LiveStore): void {
  loadDocument(store, socialMediaForm, socialMediaFormName)
}

export function getSocialAccountOptions(store: LiveStore): SocialAccountOption[] {
  ensureSocialOntologyLoaded(store)

  const unionNode = store.any(ns.foaf('Account'), OWL_DISJOINT_UNION_OF) as any
  if (!unionNode) return []

  const classNodes = expandRdfList(store, unionNode)
    .filter((node): node is NamedNode => node.termType === 'NamedNode')

  const options = classNodes.map((classNode) => {
    const label =
      store.any(classNode, ns.rdfs('label'))?.value ||
      utils.label(classNode) ||
      classNode.value

    const iconValue = store.any(classNode, ns.foaf('icon'))?.value || ''
    const icon = resolveSocialIcon(classNode.value, iconValue)
    const homepage = store.any(classNode, ns.foaf('homepage'))?.value || ''
    const userProfilePrefix = store.any(classNode, ns.foaf('userProfilePrefix'))?.value || ''

    return {
      classUri: classNode.value,
      label,
      icon,
      homepage: homepage || undefined,
      userProfilePrefix: userProfilePrefix || undefined
    }
  })

  // Keep labels stable and avoid duplicates if ontology data repeats.
  const seen = new Set<string>()
  return options.filter((option) => {
    const key = option.label.toLowerCase().trim()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function nameForAccount(store: LiveStore, accountNode: any): string {
  const accountName = store.any(accountNode, ns.foaf('name')) || store.any(accountNode, ns.rdfs('label'))
  if (accountName) return accountName.value

  const classes = store.each(accountNode as any, ns.rdf('type')) as NamedNode[]
  for (const classNode of classes) {
    const classLabel = store.any(classNode, ns.rdfs('label'))
    if (classLabel) return classLabel.value
    return utils.label(classNode)
  }

  return 'Unknown Account'
}

export function iconForAccount(store: LiveStore, accountNode: any): string {
  const accountIcon = store.any(accountNode, ns.foaf('icon'))
  if (accountIcon?.value === STAR_ICON_REF) return starIconAsset
  if (accountIcon) return accountIcon.value

  const classes = store.each(accountNode as any, ns.rdf('type')) as any[]
  for (const classNode of classes) {
    if (classNode?.value?.endsWith('#OtherAccount')) return starIconAsset
    const classIcon = store.any(classNode as any, ns.foaf('icon'))
    if (classIcon?.value === STAR_ICON_REF) return starIconAsset
    if (classIcon) return classIcon.value
  }

  return DEFAULT_ICON_URI
}

export function homepageForAccount(store: LiveStore, accountNode: any): string {
  const accountHomepage = store.any(accountNode, ns.foaf('homepage'))
  if (accountHomepage) return accountHomepage.value

  const id = store.anyJS(accountNode as any, ns.foaf('accountName'), null, accountNode.doc()) || 'No_account_Name'
  const classes = store.each(accountNode as any, ns.rdf('type'))

  for (const classNode of classes) {
    if (classNode.termType === 'NamedNode') {
      const userProfilePrefix = store.any(classNode as NamedNode, ns.foaf('userProfilePrefix'))
      if (userProfilePrefix) {
        return userProfilePrefix.value + String(id).trim()
      }
    }
  }

  return store.anyJS(accountNode as any, ns.foaf('homepage'), null, accountNode.doc()) || ''
}
