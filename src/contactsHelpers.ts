import { LiveStore, NamedNode, sym, st, literal } from 'rdflib'
import { login, ns, utils } from 'solid-ui'
import ContactsModuleRdfLib from '@solid-data-modules/contacts-rdflib'
import type { NewContact, AddressBook } from '@solid-data-modules/contacts-rdflib'
import { DataBrowserContext } from 'pane-registry' 
import { createAddressBookUriSelectorDialog } from './ContactsCard' 
import './styles/ContactsCard.css'
import { authn, solidLogicSingleton } from 'solid-logic' 
import { AddressBookDetails, AddressBooksData, ContactData, EmailDetails, GroupData, PhoneDetails, SelectedAddressBookUris } from './contactsTypes' 
import { addMeToYourContactsButtonText, contactExistsAlreadyButtonText, contactExistsAlreadyByNameButtonText, errorAddressBookCreation, errorGettingAddressBooks, errorLoadingContact, errorProcessingUriAddressBook, errorReadingAddressBook, errorUnableToDetermineUserWorkspace, groupIsRequired, logInAddMeToYourContactsButtonText } from './texts' 
import { checkIfAnyUserLoggedIn } from './buttonsHelper' 
import { addErrorToErrorDisplay } from './contactsErrors' 
import contacts from 'contacts-pane'

async function addContactToAddressBook(
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData,
  addressBooksData: AddressBooksData,
  container: HTMLDivElement
) {

  const addressBookUriSelectorDialog = createAddressBookUriSelectorDialog(context, contactsModule, contactData, addressBooksData)
  container.appendChild(addressBookUriSelectorDialog)   
  addressBookUriSelectorDialog.setAttribute('open', '')  
}

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
  contact
): Promise<{webID: string, uri: string} | null> {
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

async function getAddressBooks(
  context: DataBrowserContext, 
  contactsModule: ContactsModuleRdfLib
): Promise<AddressBooksData>  {

  const allContacts = []
  const me = authn.currentUser()
  const dom = context.dom
  const div = dom.getElementById('add-to-contacts-button-container') as HTMLDivElement

  const contextForFindAppInstances = {
        target: me,
        me,
        noun: 'address book',
        div,
        dom
  }

  let addressBooksData = { 
    public: new Map(),
    private: new Map(),
    contactWebIDs: new Map(),
    contactNames: new Map()
  }
  
try {
    
    await context.session.store.fetcher.load(me)
    
    const addressBookContext = await login.findAppInstances(contextForFindAppInstances, ns.vcard('AddressBook'))
    const addressBookNodes = addressBookContext.instances
    let addressBookUris = {
      publicUris: (addressBookNodes || []).map((node) => node.value),
      privateUris: []
    }
    // let addressBookUris = await contactsModule.listAddressBooks(me.value) 

    const publicAddressBookPromises = await addressBookUris.publicUris.map(addressBook => getAddressData(context, contactsModule, addressBook))
    const publicAddressBooksData = await Promise.all(publicAddressBookPromises)
    publicAddressBooksData.map((addressBook) => {
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
  if (!me) return null
  let addressBooksData = null

  try {
    addressBooksData = await getAddressBooks(context, contactModule)
  } catch (error) {
    addErrorToErrorDisplay(context, `${errorGettingAddressBooks}\n${error}`)
  }
  return addressBooksData
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

async function getContactData(
  store: LiveStore,
  subject: NamedNode
): Promise<ContactData> {
  let emails: EmailDetails[] = []
  let phoneNumbers: PhoneDetails[] = []
  let type = null
  let email = null
  let phoneNumber = null

  const name = utils.label(subject)

  const emailNodes = store.each(subject, ns.vcard('hasEmail'), null, subject.doc()) || null
  const phoneNodes = store.each(subject, ns.vcard('hasTelephone'), null, subject.doc()) || null
 
  emailNodes.map((node) => {
    email = store.any(node as NamedNode, ns.vcard('value'), null, subject.doc())
    type = store.any(node as NamedNode, ns.rdf('type'), null, subject.doc())
    emails.push({ type, email})
  })
  phoneNodes.map((node) => {
    phoneNumber = store.any(node as NamedNode, ns.vcard('value'), null, subject.doc())
    type = store.any(node as NamedNode, ns.rdf('type'), null, subject.doc())
    phoneNumbers.push({type, phoneNumber})  
  })

  const webID = subject.value
  return {
  name,
  emails,
  phoneNumbers,
  webID 
  }
}

async function addANewAddressBookUriToAddressBooks(
  context:DataBrowserContext, 
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  enteredAddressBookUri: string
): Promise<{ addressBooksData: AddressBooksData, addressBook: AddressBookDetails }> {
  let allContacts = []
  let contactsAddressBook = null

  try {
    const addressBook = await getAddressData(context, contactsModule, enteredAddressBookUri)
    contactsAddressBook = {
      name: addressBook.title,
      groups: addressBook.groups,
      contacts: addressBook.contacts
    }
    addressBooksData.private.set(enteredAddressBookUri, contactsAddressBook)
    
    addressBook.contacts.map((contact) => {
      addressBooksData.contactNames.set(contact.name, contact.uri)
      allContacts.push(contact)
    })
    
    addressBooksData = await processContactWebIDs(context, addressBooksData, allContacts)
  } catch (error) {
    addErrorToErrorDisplay(context, errorProcessingUriAddressBook  + '\n' + error)
  }   

 return { addressBooksData, addressBook: contactsAddressBook }
}

async function createContactInAddressBook(
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  contactData: ContactData,
  selectedAddressBookUris: SelectedAddressBookUris
): Promise<string>{
  let contactUri = null
  const newContact: NewContact = {
      name: contactData.name
  }

  try { 
   
    const groupUris = (selectedAddressBookUris.groupUris.length) ? selectedAddressBookUris.groupUris : undefined
    if (groupUris) {
      contactUri = await contactsModule.createNewContact({addressBookUri: selectedAddressBookUris.addressBookUri, contact: newContact, groupUris}) 
    } else {
      addErrorToErrorDisplay(context, groupIsRequired) 
      return
    }
    await context.session.store.fetcher.load(contactUri)
    await addWebIDToContact(context, groupUris, contactUri, contactData.webID)
    if (contactData.emails.length || contactData.phoneNumbers.length) {
      await addContactDetails(context, contactUri, contactData)
    }
    return contactUri
  } catch (error) {
    addErrorToErrorDisplay(context, error)
  }      
}

async function addContactDetails(
  context: DataBrowserContext, 
  contactUri: string, 
  contactData: ContactData
) {
  const store = context.session.store
  const contactNode = new NamedNode(contactUri)
  const detailDoc = contactNode.doc()
  // needs to be a 13 digit random number.
  const max = 9999999999999
  const min = 1000000000000

  const createDetailNode = (): NamedNode => {
    const randomId = Math.floor(Math.random() * (max - min + 1)) + min
    return sym(`${detailDoc.uri}#id${randomId}`) as NamedNode
  }

  let insertions = []

  try {
 
    contactData.emails.map((emailInfo) => {
      const node = createDetailNode()
      insertions.push(st(contactNode, ns.vcard('hasEmail'), node , detailDoc))
      insertions.push(st(node, ns.rdf('type'), emailInfo.type, detailDoc))
      insertions.push(st(node, ns.vcard('value'), emailInfo.email, detailDoc))
    }) 
    contactData.phoneNumbers.map((phoneInfo) => {
      const node = createDetailNode()
      insertions.push(st(contactNode, ns.vcard('hasTelephone'), node , detailDoc))
      insertions.push(st(node, ns.rdf('type'), phoneInfo.type, detailDoc))
      insertions.push(st(node, ns.vcard('value'), phoneInfo.phoneNumber, detailDoc))
    })

    await store.updater.update([],insertions)  
  } catch (error) {
    addErrorToErrorDisplay(context, error)
  }
}

async function addWebIDToContact(
  context: DataBrowserContext,
  groupUris: string[],
  contactUri: string,
  webID: string
) {
  const store = context.session.store
  const contactNode = new NamedNode(contactUri)
  const webIDNode = sym(webID)
  const vcardURLNode = store.bnode()
  let groupUriNode = null

  try {
    if (groupUris?.length) {
      for (const groupUri of groupUris) {
        await context.session.store.fetcher.load(groupUri)
        groupUriNode = new NamedNode(groupUri)
        const groupDoc = groupUriNode.doc()
        const deletions = context.session.store.statementsMatching(
          groupUriNode,
          ns.vcard('hasMember'),
          contactNode,
          groupDoc
        )
        const insertions = [
          st(groupUriNode, ns.vcard('hasMember'), webIDNode, groupDoc),
          st(webIDNode, ns.owl('sameAs'), contactNode, groupDoc)
        ]
        await store.updater.update(deletions, insertions)
      }
    }

    const personInsertions = [
      st(contactNode, ns.vcard('url'), vcardURLNode, contactNode.doc()),
      st(vcardURLNode, ns.rdf('type'), ns.vcard('WebID'), contactNode.doc()),
      st(vcardURLNode, ns.vcard('value'), literal(webID), contactNode.doc())
    ]
    await store.updater.update([], personInsertions)
  } catch (error) {
    addErrorToErrorDisplay(context, error)
  }
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
      return
    }
    typeIndexes.map((typeIndex) => {
      if (typeIndex.label === typeOfIndex) typeIndexNode = typeIndex.index
    })
    if (typeIndexNode) {
      const registration = await solidLogicSingleton.typeIndex.registerInTypeIndex(sym(addressBookUri), typeIndexNode, ns.vcard('AddressBook'))
      if (registration) return true
    }
  } catch(error) {
    addErrorToErrorDisplay(context, error)
  }  
  return false
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

function refreshButton(
  context: DataBrowserContext,
  addressBooksData: AddressBooksData,
  contactData: ContactData
) {
  const me = authn.currentUser()
  const button = context.dom.getElementById('add-to-contacts-button')
  if (checkIfAnyUserLoggedIn(me)) {
      const contactExistsByWebID = checkIfContactExistsByWebID(addressBooksData, contactData.webID)
      const contactExistsByName = checkIfContactExistsByName(addressBooksData, contactData.name)
      if (contactExistsByWebID) {
        //logged in and friend exists or friend was just added
        button.innerHTML = contactExistsAlreadyButtonText.toUpperCase()
        button.onclick = null 
      } else if (contactExistsByName) {
        button.innerHTML = contactExistsAlreadyByNameButtonText.toUpperCase()
        button.removeAttribute('disabled') 
      }
        else {
        //logged in and friend does not exist yet
        button.innerHTML = addMeToYourContactsButtonText.toUpperCase()
      }
    } else {
      //not logged in
      button.innerHTML = logInAddMeToYourContactsButtonText.toUpperCase()
    }
  }

function checkIfContactExistsByWebID(
  addressBooksData: AddressBooksData,
  subjectUri: string,
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

async function addWebIDToExistingContact(
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  webID: string,
  contactUri: string
) {

  try {
    const groupUris = await getGroupUrisForContact(contactsModule, addressBooksData, contactUri)
    await addWebIDToContact(context, groupUris, contactUri, webID)
  } catch (error) {
    addErrorToErrorDisplay(context, error)
  }
}

async function getGroupUrisForContact(
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  contactUri: string
): Promise<Array<string>> {
  let groupUrisForContact = []
  let addressBookForContact = null
  let allGroupUrisForAddressBook = []
  
  addressBooksData.public.forEach((book, uri) => {
    book.contacts.map((contact) => {
      if (contact.uri === contactUri) {
        addressBookForContact = book
      }
    })
  })
  addressBooksData.private.forEach((book, uri) => {
    book.contacts.map((contact) => {
      if (contact.uri === contactUri) {
        addressBookForContact = book
      }
    })
  })
  allGroupUrisForAddressBook = addressBookForContact.groups
  const groupPromises = allGroupUrisForAddressBook.map(async (group) => {
    group = await contactsModule.readGroup(group.uri)
    return { groupUri: group.uri, group }
  })  
  const groups = await Promise.all(groupPromises)

  groups.map((groupInfo) => {
    groupInfo.group.members.map((contact) => {
      if (contact.uri === contactUri) {
        if (!groupUrisForContact.includes(groupInfo.groupUri)) {
          groupUrisForContact.push(groupInfo.groupUri)
        }       
      }
    })
  })
  
  return groupUrisForContact
}

function addGroupToAddressBookData(
  addressBooksData: AddressBooksData,
  addressBookUri: string,
  group: GroupData
): boolean {
  const publicAddressBook = addressBooksData.public.get(addressBookUri)
  if (publicAddressBook) {
    const groupExists = publicAddressBook.groups.some((existingGroup) => existingGroup.uri === group.uri)
    if (!groupExists) {
      addressBooksData.public.set(addressBookUri, {
        ...publicAddressBook,
        groups: [...publicAddressBook.groups, group]
      })
    }
    return true
  }

  const privateAddressBook = addressBooksData.private.get(addressBookUri)
  if (privateAddressBook) {
    const groupExists = privateAddressBook.groups.some((existingGroup) => existingGroup.uri === group.uri)
    if (!groupExists) {
      addressBooksData.private.set(addressBookUri, {
        ...privateAddressBook,
        groups: [...privateAddressBook.groups, group]
      })
    }
    return true
  }

  return false
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

    const normalizedContainer = newAddressContainer.endsWith('/')
      ? newAddressContainer
      : `${newAddressContainer}/`

    const addressBookSlug = (containerName || 'address-book')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'address-book'

    const newBase = `${normalizedContainer}${addressBookSlug}/`
    const mintResult = await contacts.mintNew(dataBrowserContext, {
      me,
      dom: dataBrowserContext.dom,
      div,
      newBase,
      instanceClass: ns.vcard('AddressBook'),
      instanceName: enteredAddressName
    })

    addressBookUri = mintResult?.newInstance?.uri || `${newBase}index.ttl#this`
    await updateAddressBookName(dataBrowserContext, addressBookUri, enteredAddressName)

  } catch (error) {
    addErrorToErrorDisplay(dataBrowserContext, errorAddressBookCreation + '\n' + error)
  }
  return addressBookUri
}

export {
  getAddressBooksData,
  getContactData,
  addContactToAddressBook,
  createContactInAddressBook,
  addAddressToTypeIndex,
  refreshButton,
  checkIfContactExistsByWebID,
  checkIfContactExistsByName,
  addWebIDToExistingContact,
  addANewAddressBookUriToAddressBooks,
  addGroupToAddressBookData,
  updateAddressBookName,
  handleAddressBookCreation
}