import { DataBrowserContext } from "pane-registry"
import { widgets } from "solid-ui"
import { AddressBookDetails, AddressBooksData, ContactData, createContactInAddressBook, GroupData } from "./contactsHelpers"
import ContactsModuleRdfLib from "@solid-data-modules/contacts-rdflib"

export const createAddressBookUriSelectorDiv = (context: DataBrowserContext): HTMLDivElement => {
  const addressBookUriSelectorDiv = context.dom.createElement('div')
    addressBookUriSelectorDiv.setAttribute('role', 'addressBookList')
    addressBookUriSelectorDiv.setAttribute('aria-live', 'polite')
    addressBookUriSelectorDiv.setAttribute('tabindex', '0')
    addressBookUriSelectorDiv.classList.add('addressSelector')
    addressBookUriSelectorDiv.setAttribute('draggable', 'true')
    
    return addressBookUriSelectorDiv
}

export const createAddressBookListDiv = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData,
  addressBooksData: AddressBooksData,
  addressBookUriSelectorDiv: HTMLDivElement
): HTMLDivElement => {

  const addressBookListDiv = context.dom.createElement('div')
  addressBookListDiv.setAttribute('class', 'addressList')
  addressBookListDiv.innerHTML = "Pick an address book:"
  const setButtonOnClickHandler =  (event) => {
    const selectedAddressBookUri = event.target.id
    console.log("Selected addressBook: " + selectedAddressBookUri)
    
    const addressBook = addressBooksData.public.get(selectedAddressBookUri)
    const setGroupButtonOnClickHandler = async (event) => {
      const selectedGroupUri = event.target.id
      const selectedAddressBookUris = { 
        addressBookUri: selectedAddressBookUri,
        groupUris: [selectedGroupUri] 
      }
      const contact = await createContactInAddressBook(contactsModule, contactData, selectedAddressBookUris)
      console.log("contact: " + contact)
    }
    const groupListDiv = context.dom.createElement('div')
    addressBook.groups.map((group) => {
      groupListDiv.appendChild(createGroupButton(context, group, setGroupButtonOnClickHandler))
    })
    addressBookUriSelectorDiv.appendChild(groupListDiv)
  }
  addressBooksData.public.forEach((addressBook, addressBookUri) => {
    addressBookListDiv.appendChild(createAddressBookButton(context, addressBook, addressBookUri, 'public', setButtonOnClickHandler))
  })

  addressBooksData.private.forEach((addressBook, addressBookUri) => {
    addressBookListDiv.appendChild(createAddressBookButton(context, addressBook, addressBookUri, 'private', setButtonOnClickHandler))
  })
  addressBookListDiv.appendChild(createAddNewAddressBookButton(context))

  return addressBookListDiv
}

const createAddressBookButton = (
  context: DataBrowserContext,
  addressBook: AddressBookDetails,
  addressBookUri: string,
  index: string,
  setButtonOnClickHandler: Function
): HTMLButtonElement => {
  const options = (index === 'private') ? { needsBorder: true, buttonColor: 'Secondary'} : { needsBorder: true }
  const button = widgets.button(
    context.dom,
    undefined,
    addressBook.name + " (" + index + ")",
    setButtonOnClickHandler, //sets an onclick event listener
    options
  )
  button.setAttribute('value', addressBook)
  button.setAttribute('id', addressBookUri)

  return button
}

const createGroupButton = (
  context: DataBrowserContext,
  group: GroupData,
  setButtonOnClickHandler: Function
): HTMLButtonElement => {
 
  const button = widgets.button(
    context.dom,
    undefined,
    group.name,
    setButtonOnClickHandler, //sets an onclick event listener
    {
      needsBorder: true
    }
  )
  button.setAttribute('value', group.name)
  button.setAttribute('id', group.uri)

  return button
}

const createAddNewAddressBookButton = (
  context: DataBrowserContext
): HTMLButtonElement => {

  const setButtonOnClickHandler = () => {
    // ask user public or private
    // ask user for the name of addressbook
    
    // AddressBook creation using solid-data-modules
    //Public
    /* const uri = await module.createAddressBook({
     containerUri: "https://pod.example/alice/",
     name: "new address book"
     })
     */
    // Private
    /*
    const ownerWebId = "http://localhost:3000/alice/profile/card#me"
await contacts.createAddressBook({
    containerUri: "http://localhost:3000/alice/public-write/",
    name: "new address book",
    ownerWebId
})
    */
  }

  const button = widgets.button(
    context.dom,
    undefined,
    "Add New AddressBook",
    setButtonOnClickHandler, //sets an onclick event listener
    {
      needsBorder: true,
    }
  )
  return button
}
