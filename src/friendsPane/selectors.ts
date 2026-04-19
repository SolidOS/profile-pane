import { DataBrowserContext } from 'pane-registry'
import { LiveStore, NamedNode, Node } from 'rdflib'
import { ns, widgets } from 'solid-ui'
import { FriendDetails, ProfileDetails } from './types'

const FRIEND_BATCH_SIZE = 3

/* pronounsAsText and formatLocation were copied from HeadingSection selectors */
export function pronounsAsText (store: LiveStore, subject:NamedNode): string {
  let pronouns = store.anyJS(subject, ns.solid('preferredSubjectPronoun')) || ''
  if (pronouns) {
    const them = store.anyJS(subject, ns.solid('preferredObjectPronoun'))
    if (them) {
      pronouns += '/' + them
    }
  }
  return pronouns || ''
}

function formatLocation(countryName: string | void, locality: string | void) {
  return countryName && locality
    ? `${locality}, ${countryName}`
    : countryName || locality || null
}

function toFriendDetails(store: any, friendNode: NamedNode): FriendDetails {
  const name =
    store.anyValue(friendNode, ns.vcard('fn')) ||
    store.anyValue(friendNode, ns.foaf('name')) ||
    undefined
  const nickname =
    store.anyValue(friendNode, ns.vcard('nickname')) ||
    store.anyValue(friendNode, ns.foaf('nick')) ||
    undefined
  const dateOfBirth = store.anyValue(friendNode, ns.vcard('bday')) || undefined
  const imageSrc = widgets.findImage(friendNode)
  const jobTitle = store.anyValue(friendNode, ns.vcard('role')) || undefined
  const orgName = store.anyValue(friendNode, ns.vcard('organization-name')) || undefined
  const primaryAddressEntryNode = store.any(friendNode, ns.vcard('hasAddress')) as Node || undefined
  const address: Node | null = primaryAddressEntryNode || null
  const countryName =
      address != null
        ? store.anyValue(address as NamedNode, ns.vcard('country-name'))
        : null
  const locality =
    address != null
      ? store.anyValue(address as NamedNode, ns.vcard('locality'))
      : null

    const location = formatLocation(countryName, locality)
    const pronouns = pronounsAsText(store, friendNode)
    
  return {
    url: friendNode.value,
    imageUrl: imageSrc,
    name,
    nickname,
    jobTitle,
    organization: orgName,
    birthdate: dateOfBirth,
    location,
    pronouns,
    subjectNode: friendNode
  }
}

export async function * streamFriends(
  context: DataBrowserContext,
  subject: NamedNode,
  batchSize = FRIEND_BATCH_SIZE
): AsyncGenerator<FriendDetails[], void, void> {
  const store = context.session.store
  const fetcher = (store as any)?.fetcher

  if (fetcher && typeof fetcher.load === 'function') {
    try {
      await fetcher.load(subject.doc())
    } catch {
      // Continue with whatever is already in the store.
    }
  }

  const seen = new Set<string>()
  const friendNodes = store.each(subject, ns.foaf('knows'), null, subject.doc())
  const uniqueFriendNodes: NamedNode[] = []

  for (const friendNode of friendNodes) {
    const key = friendNode?.value
    if (!key || seen.has(key) || subject.value === key) continue
    seen.add(key)
    uniqueFriendNodes.push(friendNode as NamedNode)
  }

  const friends: FriendDetails[] = []

  for (const friendNode of uniqueFriendNodes) {
    if (fetcher && typeof fetcher.load === 'function') {
      try {
        await fetcher.load(friendNode.doc())
      } catch {
        // Keep partial friend data when one linked document fails to load.
      }
    }

    friends.push(toFriendDetails(store, friendNode))

    if (friends.length % batchSize === 0) {
      yield [...friends]
    }
  }

  if (friends.length > 0 && friends.length % batchSize !== 0) {
    yield [...friends]
  }
}

export async function extractFriends(context: DataBrowserContext, subject: NamedNode): Promise<FriendDetails[] | null> {
  let latestFriends: FriendDetails[] | null = null

  for await (const friends of streamFriends(context, subject)) {
    latestFriends = friends
  }

  return latestFriends
}

export async function selectProfileData(context: DataBrowserContext, subject: NamedNode): Promise<ProfileDetails | null> {
  const store = context.session.store

  const name =
      store.anyValue(subject, ns.vcard('fn')) ||
      store.anyValue(subject, ns.foaf('name')) ||
      undefined
    const nickname =
      store.anyValue(subject, ns.vcard('nickname')) ||
      store.anyValue(subject, ns.foaf('nick')) ||
      undefined
    const dateOfBirth = store.anyValue(subject, ns.vcard('bday')) || undefined
    const imageSrc = widgets.findImage(subject)
    const jobTitle = store.anyValue(subject, ns.vcard('role')) || undefined
    const orgName = store.anyValue(subject, ns.vcard('organization-name')) || undefined
    const primaryAddressEntryNode = store.any(subject, ns.vcard('hasAddress')) as Node || undefined
    const address: Node | null = primaryAddressEntryNode || null
    const countryName =
        address != null
          ? store.anyValue(address as NamedNode, ns.vcard('country-name'))
          : null
    const locality =
      address != null
        ? store.anyValue(address as NamedNode, ns.vcard('locality'))
        : null

    const location = formatLocation(countryName, locality)
    const pronouns = pronounsAsText(store, subject)
    return {
      url: subject.value,
      imageUrl: imageSrc,
      name,
      nickname,
      jobTitle,
      organization: orgName,
      birthdate: dateOfBirth,
      location,
      pronouns
    }
}
