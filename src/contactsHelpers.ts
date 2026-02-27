import { LiveStore, NamedNode, sym, st } from "rdflib"
import { ns, utils } from "solid-ui"
import ContactsModuleRdfLib, { NewContact } from "@solid-data-modules/contacts-rdflib"
import { DataBrowserContext } from "pane-registry";
import { addErrorToErrorDisplay, createAddressBookUriSelectorDialog } from "./ContactsCard";
import './styles/ContactsCard.css'
import { authn } from "solid-logic";
import { AddressBooksData, ContactData, EmailDetails, PhoneDetails, SelectedAddressBookUris } from "./contactsTypes";
import { addMeToYourContactsButtonText, contactExistsAlreadyButtonText, errorGettingAddressBooks, errorLoadingContact, errorReadingAddressBook, logInAddMeToYourContactsButtonText } from "./texts";
import { checkIfAnyUserLoggedIn } from "./buttonsHelper";

async function addContactToAddressBook(
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData,
  addressBooksData: AddressBooksData,
  container: HTMLDivElement,
  subject: NamedNode
) {

  const addressBookUriSelectorDialog = createAddressBookUriSelectorDialog(context, contactsModule, contactData, addressBooksData, subject)
  container.appendChild(addressBookUriSelectorDialog)   
  addressBookUriSelectorDialog.setAttribute('open', ''); 
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
      const result = await contactModule.readAddressBook(addressBookUri)
      return result
    } catch (error) {
      addErrorToErrorDisplay(context, `${errorReadingAddressBook}\n${error}`)
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
      addErrorToErrorDisplay(context, `${errorLoadingContact}${contact.uri}\n${error}`)
    }  
  }
  
try {
    const me = authn.currentUser()
    await context.session.store.fetcher.load(me)
    
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

  // Need to fix below right now don't want to add
  // while testing
  // const webID = subject.value 
  const webID = 'https://testingsolidos.solidcommunity.net/profile/card#me'
  return {
  name,
  emails,
  phoneNumbers,
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
      name: contactData.name
  }

  try { 
    const groupUris = (selectedAddressBookUris.groupUris.length  != 0) ? selectedAddressBookUris.groupUris : undefined
    if (groupUris) {
      contactUri = await contactsModule.createNewContact({addressBookUri: selectedAddressBookUris.addressBookUri, contact: newContact, groupUris}) 
    } else {
      contactUri = await contactsModule.createNewContact({addressBookUri: selectedAddressBookUris.addressBookUri, contact: newContact})   
    } 
    await context.session.store.fetcher.load(contactUri)
    await addWebIDToContact(context, groupUris, contactUri, contactData.webID)
    if (contactData.emails.length != 0 || contactData.phoneNumbers.length != 0) {
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
  let node = null
  const max = 9999999999999
  const min = 1000000000000
       //node = sym(`#id${Math.floor(Math.random() * (max - min + 1)) + min}`)
      console.log("node: " + JSON.stringify(node))
  let insertions = []

  console.log("emails: " + JSON.stringify(contactData.emails))
  console.log("phoneNumbers: " + JSON.stringify(contactData.phoneNumbers))
  try {
 
    contactData.emails.map((emailInfo) => {
      node = store.bnode()
      insertions.push(st(contactNode, ns.vcard("hasEmail"), node , contactNode.doc()))
      insertions.push(st(node, ns.rdf('type'), emailInfo.type, contactNode.doc()))
      insertions.push(st(node, ns.vcard("value"), emailInfo.email, contactNode.doc()))
    }) 
    contactData.phoneNumbers.map((phoneInfo) => {
      node = store.bnode()
      insertions.push(st(contactNode, ns.vcard("hasTelephone"), node , contactNode.doc()))
      insertions.push(st(node, ns.rdf('type'), phoneInfo.type, contactNode.doc()))
      insertions.push(st(node, ns.vcard("value"), phoneInfo.phoneNumber, contactNode.doc()))  
    })
    console.log("insertions: " + JSON.stringify(insertions))
    await context.session.store.fetcher.load(contactUri)
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
  const node = store.bnode()
  const insertions = []
  let groupUriNode = null

  try {
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
    addErrorToErrorDisplay(context, error)
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
    addErrorToErrorDisplay(context, error)
  }  
}

function refreshButton(
  context: DataBrowserContext,
  subject: NamedNode, 
  addressBooksData: AddressBooksData
) {
  const me = authn.currentUser()
  const button = context.dom.getElementById('add-to-contacts-button')
  if (checkIfAnyUserLoggedIn(me)) {
      const contactExists = checkIfContactExists(subject, addressBooksData)
      if (contactExists) {
        //logged in and friend exists or friend was just added
        button.innerHTML = contactExistsAlreadyButtonText.toUpperCase()
        button.onclick = null 
      } else {
        //logged in and friend does not exist yet
        button.innerHTML = addMeToYourContactsButtonText.toUpperCase()
      }
    } else {
      //not logged in
      button.innerHTML = logInAddMeToYourContactsButtonText.toUpperCase()
    }
  }

function checkIfContactExists(
  subject: NamedNode,
  addressBooksData: AddressBooksData
): boolean {
 if (addressBooksData.contacts.has(subject.value)) return true
  return false
}

export {
  getAddressBooksData,
  getContactData,
  addContactToAddressBook,
  createContactInAddressBook,
  addAddressToPublicTypeIndex,
  refreshButton,
  checkIfContactExists
}