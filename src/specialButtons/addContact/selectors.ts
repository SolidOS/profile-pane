import { LiveStore, NamedNode } from 'rdflib'
import { ns, utils } from 'solid-ui'
import ContactsModuleRdfLib from '@solid-data-modules/contacts-rdflib'
import type { AddressBook } from '@solid-data-modules/contacts-rdflib'
import { DataBrowserContext } from 'pane-registry'
import { authn } from 'solid-logic'
import { AddressBooksData, ContactData, EmailDetails, PhoneDetails } from './contactsTypes'
import { errorGettingAddressBooks, errorLoadingContact, errorReadingAddressBook } from '../../texts'
import { addErrorToErrorDisplay } from './contactsErrors'

async function getAddressData(
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBookUri: string
): Promise<AddressBook | null> {
  let result = null
  try {
    result = await contactsModule.readAddressBook(addressBookUri)
  } catch (error) {
    addErrorToErrorDisplay(context, `${errorReadingAddressBook}\n${error}`)
  }
  return result
}

async function getWebID(
  context: DataBrowserContext,
  contact: { uri: string }
): Promise<{ webID: string, uri: string } | null> {
  let webID = null
  let node = null
  let webIDNode = null

  try {
    await context.session.store.fetcher.load(contact.uri.substring(0, contact.uri.length - 5))
    node = new NamedNode(contact.uri)
    webIDNode = context.session.store.any(node, ns.vcard('url'), undefined, node.doc())
    if (webIDNode) {
      webID = context.session.store.anyValue(webIDNode, ns.vcard('value'), undefined, node.doc())
      return { webID, uri: contact.uri }
    }
    return null
  } catch (error) {
    addErrorToErrorDisplay(context, `${errorLoadingContact}${contact.uri}\n${error}`)
  }
}

async function processContactWebIDs(
  context: DataBrowserContext,
  addressBooksData: AddressBooksData,
  allContacts: Array<{ name: string, uri: string }>
): Promise<AddressBooksData> {
  const contactPromises = allContacts.map(getWebID.bind(null, context))
  const results = await Promise.all(contactPromises)

  results.map((contact) => {
    if (contact?.webID) addressBooksData.contactWebIDs.set(contact.webID.trim(), contact.uri)
  })

  return addressBooksData
}

async function getAddressBooks(
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib
): Promise<AddressBooksData> {
  const allContacts = []
  const me = authn.currentUser()

  let addressBooksData = {
    public: new Map(),
    private: new Map(),
    contactWebIDs: new Map(),
    contactNames: new Map()
  }

  try {
    await context.session.store.fetcher.load(me)

    const addressBookUris = await contactsModule.listAddressBooks(me.value)

    const publicAddressBookPromises = addressBookUris.publicUris.map(addressBook => getAddressData(context, contactsModule, addressBook))
    const publicAddressBooksData = await Promise.all(publicAddressBookPromises)
    publicAddressBooksData.map((addressBook) => {
      if (!addressBook) return
      addressBooksData.public.set(addressBook.uri, {
        name: addressBook.title,
        groups: addressBook.groups,
        contacts: addressBook.contacts
      })
      addressBook.contacts.map((contact) => {
        addressBooksData.contactNames.set(contact.name, contact.uri)
        allContacts.push(contact)
      })
    })

    const privateAddressBookPromises = addressBookUris.privateUris.map(addressBook => getAddressData(context, contactsModule, addressBook))
    const privateAddressBooksData = await Promise.all(privateAddressBookPromises)
    privateAddressBooksData.map((addressBook) => {
      if (!addressBook) return
      addressBooksData.private.set(addressBook.uri, {
        name: addressBook.title,
        groups: addressBook.groups,
        contacts: addressBook.contacts
      })
      addressBook.contacts.map((contact) => {
        addressBooksData.contactNames.set(contact.name, contact.uri)
        allContacts.push(contact)
      })
    })

    addressBooksData = await processContactWebIDs(context, addressBooksData, allContacts)
  } catch (error) {
    addErrorToErrorDisplay(context, error)
  }
  return addressBooksData
}

async function getAddressBooksData(
  context: DataBrowserContext,
  contactModule: ContactsModuleRdfLib
): Promise<AddressBooksData> {
  const me = authn.currentUser()
  if (!me) return null as any
  let addressBooksData = null

  try {
    addressBooksData = await getAddressBooks(context, contactModule)
  } catch (error) {
    addErrorToErrorDisplay(context, `${errorGettingAddressBooks}\n${error}`)
  }
  return addressBooksData
}

async function getContactData(
  store: LiveStore,
  subject: NamedNode
): Promise<ContactData> {
  const emails: EmailDetails[] = []
  const phoneNumbers: PhoneDetails[] = []
  let type = null
  let email = null
  let phoneNumber = null

  const name = utils.label(subject)
  const nickname = store.anyValue(subject, ns.foaf('nick'), null, subject.doc()) || undefined
  const preferredSubjectPronoun = store.anyValue(subject, ns.solid('preferredSubjectPronoun'), null, subject.doc()) || undefined
  const preferredObjectPronoun = store.anyValue(subject, ns.solid('preferredObjectPronoun'), null, subject.doc()) || undefined
  const preferredRelativePronoun = store.anyValue(subject, ns.solid('preferredRelativePronoun'), null, subject.doc()) || undefined

  const emailNodes = store.each(subject, ns.vcard('hasEmail'), null, subject.doc()) || null
  const phoneNodes = store.each(subject, ns.vcard('hasTelephone'), null, subject.doc()) || null

  emailNodes.map((node) => {
    email = store.any(node as NamedNode, ns.vcard('value'), null, subject.doc())
    type = store.any(node as NamedNode, ns.rdf('type'), null, subject.doc())
    emails.push({ type, email })
  })
  phoneNodes.map((node) => {
    phoneNumber = store.any(node as NamedNode, ns.vcard('value'), null, subject.doc())
    type = store.any(node as NamedNode, ns.rdf('type'), null, subject.doc())
    phoneNumbers.push({ type, phoneNumber })
  })

  const webID = subject.value
  return {
    name,
    nickname,
    preferredSubjectPronoun,
    preferredObjectPronoun,
    preferredRelativePronoun,
    emails,
    phoneNumbers,
    webID
  }
}

function checkIfContactExistsByWebID(
  addressBooksData: AddressBooksData,
  subjectUri: string
): boolean {
  if (!subjectUri?.trim()) return false
  return addressBooksData.contactWebIDs.has(subjectUri.trim())
}

function checkIfContactExistsByName(
  addressBooksData: AddressBooksData,
  name: string
): string | null {
  let normalizedContactName = null
  let contactUri = null

  const normalizedSubjectName = name.replace(/\s/g, '').toLowerCase().trim()

  addressBooksData.contactNames.forEach((uri, contactName) => {
    normalizedContactName = contactName.replace(/\s/g, '').toLowerCase().trim()
    if (normalizedSubjectName === normalizedContactName) return contactUri = uri
  })

  return contactUri
}

export {
  getAddressBooksData,
  getContactData,
  checkIfContactExistsByWebID,
  checkIfContactExistsByName
}