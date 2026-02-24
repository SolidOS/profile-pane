import { LiveStore, NamedNode, sym, st } from "rdflib"
import { ns, utils } from "solid-ui"
import ContactsModuleRdfLib, { NewContact } from "@solid-data-modules/contacts-rdflib"
import { DataBrowserContext } from "pane-registry";
import { createAddressBookUriSelectorDiv } from "./ContactsCard";
import './styles/ContactsCard.css'
import { authn } from "solid-logic";
import { AddressBooksData, ContactData, SelectedAddressBookUris } from "./contactsTypes";

async function addContactToAddressBook(
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData,
  addressBooksData: AddressBooksData,
  container: HTMLDivElement
) {

  const addressBookUriSelectorDiv = createAddressBookUriSelectorDiv(context, contactsModule, contactData, addressBooksData)
  container.appendChild(addressBookUriSelectorDiv)   
}

async function getAddressBooks(
  context: DataBrowserContext, 
  contactModule: ContactsModuleRdfLib
): Promise<AddressBooksData>  {

  let webID = null
  let node = null
  let webIDNode = null
  const allContacts = []

  const addressBooksData = { 
    public: new Map(),
    private: new Map(),
    contacts: new Map()
}

  const getAddressData = async (addressBookUri) => {
    try {
      addressBookUri = addressBookUri
      const result = await contactModule.readAddressBook(addressBookUri)
      return result
    } catch (error) {
      throw new Error(error)
    }
  }

  const getWebID = async (contact) => {
    
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
      throw new Error(error)
    }  
  }
  
try {
    const me = authn.currentUser()
    await context.session.store.fetcher.load(me)
    
    console.log("Me " + me.value)
    const addressBookUris = await contactModule.listAddressBooks(me.value) 
      
    const publicAddressBookPromises = await addressBookUris.publicUris.map(getAddressData)
    const publicAddressBooksData = await Promise.all(publicAddressBookPromises)
    publicAddressBooksData.map((addressBook) => {
      addressBooksData.public.set(addressBook.uri, {
        name: addressBook.title,
        groups: addressBook.groups
      })
      addressBook.contacts.map((contact) => {
        allContacts.push(contact)
      })
    })
    const privateAddressBookPromises = await addressBookUris.privateUris.map(getAddressData)
    const privateAddressBooksData = await Promise.all(privateAddressBookPromises)
    privateAddressBooksData.map((addressBook) => {
      addressBooksData.private.set(addressBook.uri, {
        name: addressBook.title,
        groups: addressBook.groups
      })
      addressBook.contacts.map((contact) => {
        allContacts.push(contact)
      })
    })
    const contactPromises = await allContacts.map(getWebID)
    const results = await Promise.all(contactPromises)
    
    results.map((contact) => {
      if (contact) addressBooksData.contacts.set(contact.webID, contact.uri)  
    })
    

  } catch (error) {
    throw new Error(error)
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
    throw new Error(error)
  }

  return addressBooksData
}

async function getContactData(
  store: LiveStore,
  subject: NamedNode
): Promise<ContactData> {
  let email = null
  let phoneNumber = null

  const name = utils.label(subject)
  const emailUri = store.anyValue(subject, ns.vcard('hasEmail'), null, subject.doc()) || null
  const phoneUri = store.anyValue(subject, ns.vcard('hasTelephone'), null, subject.doc()) || null
  
  if (emailUri) {
    email = store.anyValue(sym(emailUri), ns.vcard('value'), null, subject.doc())
  } 
  if (phoneUri) {
    phoneNumber = store.anyValue(sym(phoneUri), ns.vcard('value'), null, subject.doc())
  }
  // const webID = subject.value 
  const webID = 'https://testingsolidos.solidcommunity.net/profile/card#me'
  return {
  name,
  email,
  phoneNumber,
  webID 
  }
}

async function createContactInAddressBook(
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData,
  selectedAddressBookUris: SelectedAddressBookUris
): Promise<string>{
  let contactUri = null
  const newContact: NewContact = {
      name: contactData.name,
      email: contactData.email,
      phoneNumber: contactData.phoneNumber
  }
  try { 
    const groupUris = (selectedAddressBookUris.groupUris.length  != 0) ? selectedAddressBookUris.groupUris : undefined
    if (groupUris) {
      contactUri = await contactsModule.createNewContact({addressBookUri: selectedAddressBookUris.addressBookUri, contact: newContact, groupUris}) 
    } else {
      contactUri = await contactsModule.createNewContact({addressBookUri: selectedAddressBookUris.addressBookUri, contact: newContact})   
    } 
    await addWebIDToContact(context, groupUris, contactUri, contactData.webID)
    return contactUri
  } catch (error) {
    throw new Error(error)
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
  const node = store.bnode()
  const insertions = []
  let groupUriNode = null

  try {
    await context.session.store.fetcher.load(contactUri)

    if (groupUris) {
      groupUris.map(async (groupUri) => {
        await context.session.store.fetcher.load(groupUri)
        groupUriNode = new NamedNode(groupUri)
        insertions.push(st(sym(webID), ns.owl('sameAs'), contactNode, groupUriNode.doc()))
        // I think this already happens with solid-data-modules
        // insertions.push(st(groupUriNode, ns.vcard('hasMember'), sym(webID), groupUriNode.doc()))      
    })
  }
    
    insertions.push(st(contactNode, ns.vcard("uri"), node , contactNode.doc()))
    insertions.push(st(node, ns.rdf('type'), ns.vcard('WebID'), contactNode.doc()))
    // @ts-ignore Webid should be a string 
    insertions.push(st(node, ns.vcard("value"), webID, contactNode.doc()))
    await store.updater.update([],insertions)    
  } catch (error) {
    throw new Error(error)
  }
}

async function addAddressToPublicTypeIndex(
  context: DataBrowserContext,
  addressBookUri: string
) {
  const store = context.session.store
  const me = authn.currentUser()
  const uuid = utils.genUuid()

  try {
    await store.fetcher.load(me)
    const predicate = ns.solid("publicTypeIndex") as NamedNode
    const typeIndex = store.any(me, predicate, null, me.doc()) as NamedNode
    const registrationNode = sym(`${typeIndex.value}#${uuid}`)
    const insertions = [st(registrationNode, ns.rdf('type'), ns.solid('TypeRegistration'), typeIndex.doc()),
      st(registrationNode, ns.solid('forClass'), ns.vcard('AddressBook'), typeIndex.doc()),
      st(registrationNode, ns.solid('instance'), sym(addressBookUri), typeIndex.doc())
    ]
    await store.updater.update([],insertions)

  } catch(error) {
    throw new Error(error)
  }  
}

export {
  getAddressBooksData,
  getContactData,
  addContactToAddressBook,
  createContactInAddressBook,
  addAddressToPublicTypeIndex
}