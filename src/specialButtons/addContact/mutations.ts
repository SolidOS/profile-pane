import { literal, NamedNode, st, sym } from 'rdflib'
import { ns } from 'solid-ui'
import ContactsModuleRdfLib from '@solid-data-modules/contacts-rdflib'
import type { NewContact } from '@solid-data-modules/contacts-rdflib'
import { DataBrowserContext } from 'pane-registry'
import { authn, solidLogicSingleton } from 'solid-logic'
import contacts from 'contacts-pane'
import { createAddressBookContactCreationDialog } from './ContactCreationDialog'
import { addErrorToErrorDisplay } from './contactsErrors'
import { openInputDialog } from '../../ui/dialog'
import {
  errorAddressBookCreation,
  errorProcessingUriAddressBook,
  errorUnableToDetermineUserWorkspace,
  groupIsRequired
} from '../../texts'
import { AddressBookDetails, AddressBooksData, ContactData, SelectedAddressBookUris } from './contactsTypes'
import { getAddressBooksData } from './selectors'

async function addContactToAddressBook(
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData,
  addressBooksData: AddressBooksData,
  container: HTMLDivElement
) {
  const launchButton = container.querySelector('#add-to-contacts-button') as HTMLButtonElement | null
  if (launchButton) launchButton.disabled = true

  const form = createAddressBookContactCreationDialog(context, contactsModule, contactData, addressBooksData)
  await openInputDialog({
    title: 'Add contact to address book',
    dom: context.dom,
    form,
    hideFooterButtons: true
  })

  const refreshedButton = container.querySelector('#add-to-contacts-button') as (HTMLButtonElement & { refresh?: () => void }) | null
  if (refreshedButton?.refresh) {
    refreshedButton.refresh()
  } else if (refreshedButton) {
    refreshedButton.disabled = false
  }
}

async function getAddressData(
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBookUri: string
) {
  const nextData = await getAddressBooksData(context, contactsModule)
  const matchingAddressBookUri = resolveAddressBookUri(nextData, addressBookUri)
  const matchingAddressBook = matchingAddressBookUri
    ? nextData?.private.get(matchingAddressBookUri) || nextData?.public.get(matchingAddressBookUri) || null
    : null
  return { nextData, matchingAddressBook, matchingAddressBookUri }
}

function getAddressBookUriCandidates(addressBookUri: string): string[] {
  if (!addressBookUri) return []

  const trimmedUri = addressBookUri.trim()
  const candidates = new Set<string>([trimmedUri])

  if (trimmedUri.endsWith('#this')) {
    const withoutFragment = trimmedUri.slice(0, -5)
    candidates.add(withoutFragment)
    if (!withoutFragment.endsWith('index.ttl')) {
      candidates.add(`${withoutFragment.replace(/\/?$/, '/') }index.ttl#this`.replace('/index.ttl#this', '/index.ttl#this'))
    }
  } else {
    candidates.add(`${trimmedUri}#this`)
    if (trimmedUri.endsWith('/')) {
      candidates.add(`${trimmedUri}index.ttl#this`)
    }
    if (trimmedUri.endsWith('index.ttl')) {
      candidates.add(`${trimmedUri}#this`)
    }
  }

  return Array.from(candidates)
}

function resolveAddressBookUri(addressBooksData: AddressBooksData | null, addressBookUri: string): string | null {
  if (!addressBooksData) return null

  const candidates = getAddressBookUriCandidates(addressBookUri)
  for (const candidate of candidates) {
    if (addressBooksData.private.has(candidate) || addressBooksData.public.has(candidate)) {
      return candidate
    }
  }

  return null
}

async function addANewAddressBookUriToAddressBooks(
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  enteredAddressBookUri: string
): Promise<{ addressBooksData: AddressBooksData, addressBook: AddressBookDetails, addressBookUri: string | null }> {
  try {
    const { nextData, matchingAddressBook, matchingAddressBookUri } = await getAddressData(context, contactsModule, enteredAddressBookUri)
    if (!matchingAddressBook || !nextData || !matchingAddressBookUri) {
      return { addressBooksData, addressBook: null as any, addressBookUri: null }
    }
    return { addressBooksData: nextData, addressBook: matchingAddressBook, addressBookUri: matchingAddressBookUri }
  } catch (error) {
    addErrorToErrorDisplay(context, errorProcessingUriAddressBook + '\n' + error)
  }

  return { addressBooksData, addressBook: null as any, addressBookUri: null }
}

async function addContactDetails(
  context: DataBrowserContext,
  contactUri: string,
  contactData: ContactData
) {
  const store = context.session.store
  const contactNode = new NamedNode(contactUri)
  const detailDoc = contactNode.doc()
  const max = 9999999999999
  const min = 1000000000000

  const createDetailNode = (): NamedNode => {
    const randomId = Math.floor(Math.random() * (max - min + 1)) + min
    return sym(`${detailDoc.uri}#id${randomId}`) as NamedNode
  }

  const insertions = []

  try {
    if (contactData.nickname) {
      insertions.push(st(contactNode, ns.foaf('nick'), literal(contactData.nickname), detailDoc))
    }
    if (contactData.preferredSubjectPronoun) {
      insertions.push(st(contactNode, ns.solid('preferredSubjectPronoun'), literal(contactData.preferredSubjectPronoun), detailDoc))
    }
    if (contactData.preferredObjectPronoun) {
      insertions.push(st(contactNode, ns.solid('preferredObjectPronoun'), literal(contactData.preferredObjectPronoun), detailDoc))
    }
    if (contactData.preferredRelativePronoun) {
      insertions.push(st(contactNode, ns.solid('preferredRelativePronoun'), literal(contactData.preferredRelativePronoun), detailDoc))
    }

    contactData.emails.map((emailInfo) => {
      const node = createDetailNode()
      insertions.push(st(contactNode, ns.vcard('hasEmail'), node, detailDoc))
      insertions.push(st(node, ns.rdf('type'), emailInfo.type, detailDoc))
      insertions.push(st(node, ns.vcard('value'), emailInfo.email, detailDoc))
    })
    contactData.phoneNumbers.map((phoneInfo) => {
      const node = createDetailNode()
      insertions.push(st(contactNode, ns.vcard('hasTelephone'), node, detailDoc))
      insertions.push(st(node, ns.rdf('type'), phoneInfo.type, detailDoc))
      insertions.push(st(node, ns.vcard('value'), phoneInfo.phoneNumber, detailDoc))
    })

    await store.updater.update([], insertions)
  } catch (error) {
    addErrorToErrorDisplay(context, error)
  }
}

async function createContactInAddressBook(
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData,
  selectedAddressBookUris: SelectedAddressBookUris
): Promise<string> {
  let contactUri = null
  const store = context.session.store
  const newContact: NewContact = {
    name: contactData.name
  }

  try {
    const groupUris = selectedAddressBookUris.groupUris.length ? selectedAddressBookUris.groupUris : undefined
    if (groupUris) {
      contactUri = await contactsModule.createNewContact({ addressBookUri: selectedAddressBookUris.addressBookUri, contact: newContact, groupUris })
    } else {
      addErrorToErrorDisplay(context, groupIsRequired)
      return null as any
    }
    await context.session.store.fetcher.load(contactUri)
    const contactNode = new NamedNode(contactUri)
    await addWebIDToContactCard(store, contactNode, contactData.webID, ns.vcard('WebID'))
    if (
      contactData.emails.length ||
      contactData.phoneNumbers.length ||
      contactData.nickname ||
      contactData.preferredSubjectPronoun ||
      contactData.preferredObjectPronoun ||
      contactData.preferredRelativePronoun
    ) {
      await addContactDetails(context, contactUri, contactData)
    }
    return contactUri
  } catch (error) {
    addErrorToErrorDisplay(context, error)
  }

  return null as any
}

async function addAddressToTypeIndex(
  context: DataBrowserContext,
  typeOfIndex: string,
  addressBookUri: string
): Promise<boolean> {
  const store = context.session.store
  const me = authn.currentUser()
  let typeIndexNode = null

  try {
    await store.fetcher.load(me)
    const typeIndexes = await solidLogicSingleton.typeIndex.loadTypeIndexesFor(me)
    if (!typeIndexes.length) {
      throw new Error('No type index found for the current user')
    }
    typeIndexes.map((typeIndex) => {
      if (typeIndex.label === typeOfIndex) typeIndexNode = typeIndex.index
    })
    if (typeIndexNode) {
      const registration = await solidLogicSingleton.typeIndex.registerInTypeIndex(sym(addressBookUri), typeIndexNode, ns.vcard('AddressBook'))
      if (registration) return true
    }
  } catch (error) {
    addErrorToErrorDisplay(context, error)
  }
  return false
}

async function addWebIDToExistingContact(
  context: DataBrowserContext,
  contactData: ContactData,
  contactUri: string
) {
  const store = context.session.store
  try {
    await context.session.store.fetcher.load(contactUri)
    const contactNode = new NamedNode(contactUri)
    await addWebIDToContactCard(store, contactNode, contactData.webID, ns.vcard('WebID'))
  } catch (error) {
    addErrorToErrorDisplay(context, error)
  }
}

async function updateAcrossDocuments(
  store: DataBrowserContext['session']['store'],
  deletions: Array<ReturnType<typeof st>>,
  insertions: Array<ReturnType<typeof st>> = []
): Promise<void> {
  const docs = deletions.concat(insertions).map((statement) => statement.why)
  const uniqueDocKeys = new Set<string>()
  const uniqueDocs = docs.filter((doc) => {
    const key = 'value' in doc ? doc.value : '__default__'
    if (uniqueDocKeys.has(key)) return false
    uniqueDocKeys.add(key)
    return true
  })

  await Promise.all(uniqueDocs.map((doc) =>
    store.updater.update(
      deletions.filter((statement) => ('value' in statement.why ? statement.why.value : '__default__') === ('value' in doc ? doc.value : '__default__')),
      insertions.filter((statement) => ('value' in statement.why ? statement.why.value : '__default__') === ('value' in doc ? doc.value : '__default__'))
    )
  ))
}

async function addWebIDToContactCard(
  store: DataBrowserContext['session']['store'],
  contactNode: NamedNode,
  webId: string,
  urlType: NamedNode
): Promise<void> {
  try {
     
    new URL(webId)
  } catch {
    throw new Error(`WebID: ${webId} is not a valid url.`)
  }

  const vcardUrlNode = store.bnode()
  const insertions = [
    st(contactNode, ns.vcard('url'), vcardUrlNode, contactNode.doc()),
    st(vcardUrlNode, ns.rdf('type'), urlType, contactNode.doc()),
    st(vcardUrlNode, ns.vcard('value'), literal(webId), contactNode.doc())
  ]

  let deletions: Array<ReturnType<typeof st>> = []
  const groups = store.each(null, ns.vcard('hasMember'), contactNode) as NamedNode[]
  groups.forEach((group) => {
    deletions = deletions.concat(store.statementsMatching(group, ns.vcard('hasMember'), contactNode, group.doc()))
    insertions.push(st(group, ns.vcard('hasMember'), sym(webId), group.doc()))
    insertions.push(st(sym(webId), ns.owl('sameAs'), contactNode, group.doc()))
  })

  await updateAcrossDocuments(store, deletions, insertions)
}

function sanitizeAlphaNumericSpaces(input: string): string {
  return (input || '')
    .replace(/[^a-zA-Z0-9 ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function updateAddressBookName(
  context: DataBrowserContext,
  addressBookUri: string,
  newName: string
) {
  const store = context.session.store
  const addressBookNode = sym(addressBookUri)
  const addressBookDoc = addressBookNode.doc()
  const trimmedName = newName?.trim()

  if (!trimmedName) return

  try {
    await store.fetcher.load(addressBookDoc)

    const deletions = [
      ...store.statementsMatching(addressBookNode, ns.dc('title'), null, addressBookDoc),
      ...store.statementsMatching(addressBookNode, ns.vcard('fn'), null, addressBookDoc)
    ]

    const insertions = [
      st(addressBookNode, ns.dc('title'), literal(trimmedName), addressBookDoc),
      st(addressBookNode, ns.vcard('fn'), literal(trimmedName), addressBookDoc)
    ]

    await store.updater.update(deletions, insertions)
  } catch (error) {
    addErrorToErrorDisplay(context, error)
  }
}

async function handleAddressBookCreation(
  dataBrowserContext: DataBrowserContext,
  containerName: string,
  enteredAddressName: string
): Promise<string> {
  const me = authn.currentUser()
  const newAddressContainer = me?.site()?.value
  let addressBookUri = null

  const div = dataBrowserContext.dom.getElementById('new-addressbook-form') as HTMLDivElement
  try {
    if (!me || !newAddressContainer) {
      throw new Error(errorUnableToDetermineUserWorkspace)
    }

    const sanitizedAddressName = sanitizeAlphaNumericSpaces(enteredAddressName)
    if (!sanitizedAddressName) {
      throw new Error('Address book name can only contain letters, numbers, and spaces')
    }

    const sanitizedContainerName = sanitizeAlphaNumericSpaces(containerName)

    const normalizedContainer = newAddressContainer.endsWith('/')
      ? newAddressContainer
      : `${newAddressContainer}/`

    const addressBookSlug = (sanitizedContainerName || 'address-book')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'address-book'

    const newBase = `${normalizedContainer}${addressBookSlug}/`
    const mintResult = await contacts.mintNew(dataBrowserContext, {
      me,
      dom: dataBrowserContext.dom,
      div,
      newBase,
      instanceClass: ns.vcard('AddressBook'),
      instanceName: sanitizedAddressName
    })

    addressBookUri = mintResult?.newInstance?.uri || `${newBase}index.ttl#this`
    await updateAddressBookName(dataBrowserContext, addressBookUri, sanitizedAddressName)
  } catch (error) {
    addErrorToErrorDisplay(dataBrowserContext, errorAddressBookCreation + '\n' + error)
  }
  return addressBookUri
}

export {
  addContactToAddressBook,
  createContactInAddressBook,
  addAddressToTypeIndex,
  addWebIDToExistingContact,
  addANewAddressBookUriToAddressBooks,
  updateAddressBookName,
  handleAddressBookCreation
}