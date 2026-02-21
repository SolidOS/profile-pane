import { LiveStore, NamedNode, sym } from "rdflib"
import { ns, utils } from "solid-ui"
import ContactsModuleRdfLib from "@solid-data-modules/contacts-rdflib"
import { DataBrowserContext } from "pane-registry";
import { createAddressBookListDiv, createAddressBookUriSelectorDiv } from "./ContactsCard";
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
      addressBookUri = addressBookUri + '#this'
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
  // await context.session.store.fetcher.load(me) - just thought I would try this
    // Todo later use solid-data-modules to get address books
    // const addressBookUris = await contactModule.listAddressBooks(me) 
    // console.log("AddressBooks: " + JSON.stringify(addressBookUris))
   
    const addressBookUris = {
      publicUris:['https://sstratsianis.solidcommunity.net/EFHmoi/index.ttl', 'https://sstratsianis.solidcommunity.net/QKXBP7/index.ttl'],
      privateUris: ['https://sstratsianis.solidcommunity.net/QKXBP7/index.ttl']
    } 
      
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
    return {
    name,
    email,
    phoneNumber,
    webID: subject.value
  }
}

async function createContactInAddressBook(
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData,
  selectedAddressBookUris: SelectedAddressBookUris
): Promise<string>{
  try { 
    const contact = await contactsModule.createNewContact({addressBookUri: selectedAddressBookUris.addressBookUri, contact: { name: "Sally", email: "testing@gmail.com", phoneNumber: "5555-5555"}, groupUris: selectedAddressBookUris.groupUris}) 
    return contact
  } catch (error) {
    throw new Error(error)
  }      
}

export {
  getAddressBooksData,
  getContactData,
  addContactToAddressBook,
  createContactInAddressBook
}