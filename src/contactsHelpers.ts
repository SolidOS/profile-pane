import { LiveStore, NamedNode, sym } from "rdflib"
import { ns, utils } from "solid-ui"
import ContactsModuleRdfLib, { NewContact } from "@solid-data-modules/contacts-rdflib"
import { DataBrowserContext } from "pane-registry";
import { createAddressBookListDiv } from "./contactsCards";
import './styles/contactCards.css'
interface SelectedAddressBookUris {
  addressBookUri: string,
  groupUris: string[] | null
}

interface AddressBooks {
  public: {
    addressBooks: Map<string, string>
  },
  private: {
    addressBooks: Map<string, string>
  }
}

async function getSelectedAddressBookUris(
  contacts: ContactsModuleRdfLib,
  context: DataBrowserContext,
  me: string,
  container: HTMLDivElement
): Promise<SelectedAddressBookUris> {
  const addressBookUri = ''
  const groupUris = null
    
  const addressBookUriSelectorDiv = createAddressBookUriSelectorDiv(context)
  
  try {
      
    // const addressBooks = await getAddressBooks()

    // go through public index and private index building 
    // the cards to present to the user.

    const addressBookList = [
      "Friend",
      "Co-Workers",
      "Solid"
    ]


    const addressBookListDiv = createAddressBookListDiv(context, addressBookList)
    addressBookUriSelectorDiv.appendChild(addressBookListDiv)

    container.appendChild(addressBookUriSelectorDiv)
    
  } catch (error) {
    throw new Error(error)
  }

  return { 
    addressBookUri, 
    groupUris
  }
}

async function getAddressBooks(
  context: DataBrowserContext, 
  contacts: ContactsModuleRdfLib,
  me: string
): Promise<AddressBooks>  {
 
  const addressBooks = { 
    public: {
      addressBooks: new Map()
  },
    private: {
      addressBooks: new Map()
    }
}

  try {
    // Todo later use solid-data-modules to get address books
    // const addressBookUris = await contacts.listAddressBooks(me) 
    // console.log("AddressBooks: " + JSON.stringify(addressBookUris))
   
    // this is what I get back from contacts module
    const addressBookUris = {
      publicUris:[''],
      privateUris: []
    }


  } catch (error) {
    throw new Error(error)
  }

  return addressBooks
}


const createAddressBookUriSelectorDiv = (context: DataBrowserContext): HTMLDivElement => {
  const addressBookUriSelectorDiv = context.dom.createElement('div')
    addressBookUriSelectorDiv.setAttribute('role', 'addressBookList')
    addressBookUriSelectorDiv.setAttribute('aria-live', 'polite')
    addressBookUriSelectorDiv.setAttribute('tabindex', '0')
    addressBookUriSelectorDiv.classList.add('addressSelector')
    addressBookUriSelectorDiv.setAttribute('draggable', 'true')
    
    return addressBookUriSelectorDiv
}


async function getContactData(
  store: LiveStore,
  subject: NamedNode
): Promise<NewContact> {
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
    phoneNumber
  }
}

export {
  getSelectedAddressBookUris,
  getContactData
}