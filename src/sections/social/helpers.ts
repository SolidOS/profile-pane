import { graph, LiveStore, NamedNode, parse, sym } from 'rdflib'
import { ns, utils } from 'solid-ui'
import socialMediaForm from '../../ontology/socialMedia.ttl'
import { starIcon } from '../../icons-svg/profileIcons'
import { loadDocument } from '../../rdfFormsHelper'
import { expandRdfList } from '../shared/rdfList'
import { DEFAULT_ICON_URI, socialMediaFormName } from './constants'
import discordIconAsset from '../../../icons-png/discord.png'
import dribbbleIconAsset from '../../../icons-png/dribbble.png'
import facebookIconAsset from '../../../icons-png/facebook.png'
import instagramIconAsset from '../../../icons-png/instagram.png'
import linkedinIconAsset from '../../../icons-png/linkedin.png'
import pinterestIconAsset from '../../../icons-png/pinterest.png'
import sharechatIconAsset from '../../../icons-png/sharechat.png'
import snapchatIconAsset from '../../../icons-png/snapchat.png'
import spotifyIconAsset from '../../../icons-png/spotify.png'
import telegramIconAsset from '../../../icons-png/telegram.png'
import tiktokIconAsset from '../../../icons-png/tiktok.png'
import whatsappIconAsset from '../../../icons-png/whatsapp.png'
import xIconAsset from '../../../icons-png/x.png'
import youtubeIconAsset from '../../../icons-png/youtube.png'

const OWL_DISJOINT_UNION_OF = sym('http://www.w3.org/2002/07/owl#disjointUnionOf')
const STAR_ICON_REF = 'urn:profile-pane:starIcon'
const ICON_KEY_REF_PREFIX = 'urn:profile-pane:icon:'
const SOCIAL_ONTOLOGY_URI = 'https://solidos.github.io/profile-pane/src/ontology/socialMedia.ttl'
const SOCIAL_CLASS_BASE = `${SOCIAL_ONTOLOGY_URI}#`

const STAR_ICON_URI = (() => {
  const svgMarkup = (starIcon as any)?.strings?.join('') || ''
  return svgMarkup ? `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}` : DEFAULT_ICON_URI
})()

let cachedSocialOntologyStore: LiveStore | null = null

const FALLBACK_SOCIAL_OPTIONS: SocialAccountOption[] = [
  { classUri: `${SOCIAL_CLASS_BASE}FacebookAccount`, label: 'Facebook', icon: facebookIconAsset, userProfilePrefix: 'https://www.facebook.com/', homepage: 'https://www.facebook.com/' },
  { classUri: `${SOCIAL_CLASS_BASE}InstagramAccount`, label: 'Instagram', icon: instagramIconAsset, userProfilePrefix: 'https://www.instagram.com/', homepage: 'https://www.instagram.com/' },
  { classUri: `${SOCIAL_CLASS_BASE}LinkedInAccount`, label: 'LinkedIn', icon: linkedinIconAsset, userProfilePrefix: 'https://www.linkedin.com/in/', homepage: 'https://linkedin.com/' },
  { classUri: `${SOCIAL_CLASS_BASE}TiktokAccount`, label: 'TikTok', icon: tiktokIconAsset, userProfilePrefix: 'https://www.tiktok.com/@', homepage: 'https://www.tiktok.com/' },
  { classUri: `${SOCIAL_CLASS_BASE}TwitterAccount`, label: 'X', icon: xIconAsset, userProfilePrefix: 'https://x.com/', homepage: 'https://x.com/' },
  { classUri: `${SOCIAL_CLASS_BASE}YouTubeAccount`, label: 'YouTube', icon: youtubeIconAsset, userProfilePrefix: 'https://www.youtube.com/', homepage: 'https://www.youtube.com/' },
  { classUri: `${SOCIAL_CLASS_BASE}DiscordAccount`, label: 'Discord', icon: discordIconAsset, userProfilePrefix: 'https://discord.com/users/', homepage: 'https://discord.com/' },
  { classUri: `${SOCIAL_CLASS_BASE}SnapchatAccount`, label: 'Snapchat', icon: snapchatIconAsset, userProfilePrefix: 'https://www.snapchat.com/add/', homepage: 'https://www.snapchat.com/' },
  { classUri: `${SOCIAL_CLASS_BASE}PinterestAccount`, label: 'Pinterest', icon: pinterestIconAsset, userProfilePrefix: 'https://pin.it/', homepage: 'https://pinterest.com/' },
  { classUri: `${SOCIAL_CLASS_BASE}SpotifyAccount`, label: 'Spotify', icon: spotifyIconAsset, userProfilePrefix: 'https://www.spotify.com/user/', homepage: 'https://www.spotify.com/' },
  { classUri: `${SOCIAL_CLASS_BASE}TelegramAccount`, label: 'Telegram', icon: telegramIconAsset, userProfilePrefix: 'https://t.me/', homepage: 'https://telegram.org/' },
  { classUri: `${SOCIAL_CLASS_BASE}DribbleAccount`, label: 'Dribble', icon: dribbbleIconAsset, userProfilePrefix: 'https://dribbble.com/', homepage: 'https://dribbble.com/' },
  { classUri: `${SOCIAL_CLASS_BASE}SharechatAccount`, label: 'ShareChat', icon: sharechatIconAsset, userProfilePrefix: 'https://www.sharechat.com/user/', homepage: 'https://sharechat.com/' },
  { classUri: `${SOCIAL_CLASS_BASE}WhatsAppAccount`, label: 'WhatsApp', icon: whatsappIconAsset, userProfilePrefix: 'https://wa.me/', homepage: 'https://www.whatsapp.com/' }
]

// Temporary icon mapping for locally bundled social PNG assets.
// These icon assets are intended to move to a dedicated icons project later.
const ONTOLOGY_ICON_ASSETS: Record<string, string> = {
  // New key-based references used in socialMedia.ttl.
  'discord': discordIconAsset,
  'dribbble': dribbbleIconAsset,
  'facebook': facebookIconAsset,
  'instagram': instagramIconAsset,
  'linkedin': linkedinIconAsset,
  'pinterest': pinterestIconAsset,
  'sharechat': sharechatIconAsset,
  'snapchat': snapchatIconAsset,
  'spotify': spotifyIconAsset,
  'telegram': telegramIconAsset,
  'tiktok': tiktokIconAsset,
  'whatsapp': whatsappIconAsset,
  'x': xIconAsset,
  'youtube': youtubeIconAsset,
  // Backward compatibility for older path-based ontology values.
  'discord.png': discordIconAsset,
  'dribbble.png': dribbbleIconAsset,
  'facebook.png': facebookIconAsset,
  'instagram.png': instagramIconAsset,
  'linkedin.png': linkedinIconAsset,
  'pinterest.png': pinterestIconAsset,
  'sharechat.png': sharechatIconAsset,
  'snapchat.png': snapchatIconAsset,
  'spotify.png': spotifyIconAsset,
  'telegram.png': telegramIconAsset,
  'tiktok.png': tiktokIconAsset,
  'whatsapp.png': whatsappIconAsset,
  'x.png': xIconAsset,
  'youtube.png': youtubeIconAsset
}

function resolveBundledIconAsset(iconValue: string): string {
  if (!iconValue) return ''
  const normalized = iconValue.trim().toLowerCase()

  if (normalized.startsWith(ICON_KEY_REF_PREFIX)) {
    const key = normalized.slice(ICON_KEY_REF_PREFIX.length)
    return ONTOLOGY_ICON_ASSETS[key] || ''
  }

  const marker = 'icons-png/'
  const markerIndex = normalized.lastIndexOf(marker)
  if (markerIndex === -1) return ''

  const fileName = normalized.slice(markerIndex + marker.length)
  return ONTOLOGY_ICON_ASSETS[fileName] || ''
}

function resolveSocialIcon(classUri: string, iconValue: string): string {
  if (classUri.endsWith('#OtherAccount') || iconValue === STAR_ICON_REF) {
    return STAR_ICON_URI
  }
  const bundledIcon = resolveBundledIconAsset(iconValue)
  if (bundledIcon) return bundledIcon
  return iconValue || DEFAULT_ICON_URI
}

function getSocialOntologyStore(): LiveStore {
  if (cachedSocialOntologyStore) return cachedSocialOntologyStore

  const ontologyStore = graph() as unknown as LiveStore
  parse(socialMediaForm, ontologyStore as any, SOCIAL_ONTOLOGY_URI, 'text/turtle', () => null)
  cachedSocialOntologyStore = ontologyStore
  return ontologyStore
}

export type SocialAccountOption = {
  classUri: string
  label: string
  icon: string
  homepage?: string
  userProfilePrefix?: string
}

function normalizeSocialOptionKey(value: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[#:/]/g, ' ')
    .replace(/account\b/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export function findSocialAccountOption(options: SocialAccountOption[], value: string): SocialAccountOption | undefined {
  const rawValue = (value || '').trim()
  if (!rawValue) return undefined

  const lowerValue = rawValue.toLowerCase()
  const direct = options.find((option) => {
    return option.classUri.toLowerCase() === lowerValue || option.label.toLowerCase() === lowerValue
  })
  if (direct) return direct

  const key = normalizeSocialOptionKey(rawValue)
  if (!key) return undefined

  return options.find((option) => {
    const optionLabelKey = normalizeSocialOptionKey(option.label)
    const optionClassKey = normalizeSocialOptionKey(option.classUri)
    return optionLabelKey === key || optionClassKey === key
  })
}

export function ensureSocialOntologyLoaded(store: LiveStore): void {
  loadDocument(store, socialMediaForm, socialMediaFormName)
}

export function getSocialAccountOptions(store: LiveStore): SocialAccountOption[] {
  ensureSocialOntologyLoaded(store)
  const ontologyStore = getSocialOntologyStore()

  const classNodeMap = new Map<string, NamedNode>()

  const unionNode = ontologyStore.any(ns.foaf('Account'), OWL_DISJOINT_UNION_OF) as any
  if (unionNode) {
    const unionClassNodes = expandRdfList(ontologyStore, unionNode)
      .filter((node): node is NamedNode => node.termType === 'NamedNode')
    for (const classNode of unionClassNodes) {
      classNodeMap.set(classNode.value, classNode)
    }
  }

  // Fallback/augmentation: include any class declared as a foaf:Account subclass.
  const subclassStatements = ontologyStore.statementsMatching(undefined as any, ns.rdfs('subClassOf'), ns.foaf('Account'))
  for (const statement of subclassStatements) {
    const classNode = statement.subject
    if (classNode?.termType === 'NamedNode') {
      classNodeMap.set(classNode.value, classNode as NamedNode)
    }
  }

  const classNodes = Array.from(classNodeMap.values())
  if (!classNodes.length) return []

  const options: SocialAccountOption[] = classNodes.map((classNode) => {
    const label =
      ontologyStore.any(classNode, ns.rdfs('label'))?.value ||
      utils.label(classNode) ||
      classNode.value

    const iconValue = ontologyStore.any(classNode, ns.foaf('icon'))?.value || ''
    const icon = resolveSocialIcon(classNode.value, iconValue)
    const homepage = ontologyStore.any(classNode, ns.foaf('homepage'))?.value || ''
    const userProfilePrefix = ontologyStore.any(classNode, ns.foaf('userProfilePrefix'))?.value || ''

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
  const normalizedOptions = options.filter((option) => {
    const key = option.label.toLowerCase().trim()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })

  for (const fallbackOption of FALLBACK_SOCIAL_OPTIONS) {
    const key = fallbackOption.label.toLowerCase().trim()
    if (!seen.has(key)) {
      normalizedOptions.push(fallbackOption)
      seen.add(key)
    }
  }

  return normalizedOptions
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
  if (accountIcon?.value === STAR_ICON_REF) return STAR_ICON_URI
  if (accountIcon) {
    const bundledIcon = resolveBundledIconAsset(accountIcon.value)
    if (bundledIcon) return bundledIcon
    return accountIcon.value
  }

  const classes = store.each(accountNode as any, ns.rdf('type')) as any[]
  for (const classNode of classes) {
    if (classNode?.value?.endsWith('#OtherAccount')) return STAR_ICON_URI
    const classIcon = store.any(classNode as any, ns.foaf('icon'))
    if (classIcon?.value === STAR_ICON_REF) return STAR_ICON_URI
    if (classIcon) {
      const bundledIcon = resolveBundledIconAsset(classIcon.value)
      if (bundledIcon) return bundledIcon
      return classIcon.value
    }
  }

  return DEFAULT_ICON_URI
}

export function homepageForAccount(store: LiveStore, accountNode: any): string {
  const accountHomepage = store.any(accountNode, ns.foaf('homepage'))
  if (accountHomepage) return accountHomepage.value

  const id = String(store.anyJS(accountNode as any, ns.foaf('accountName'), null, accountNode.doc()) || 'No_account_Name').trim()
  if (/^https?:\/\//i.test(id)) return id

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
