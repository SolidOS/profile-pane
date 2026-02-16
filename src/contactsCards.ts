import { DataBrowserContext } from "pane-registry"
import { widgets } from "solid-ui"
// import './styles/contactCards.css'

export const createAddressBookListDiv = (
  context: DataBrowserContext,
  addressBookList: string[]
): HTMLDivElement => {

  const addressBookListDiv = context.dom.createElement('div')
  addressBookListDiv.setAttribute('class', 'addressList')
  addressBookListDiv.innerHTML = "Pick an address book:"
  const setButtonOnClickHandler = (event) => {
    const selectedAddressBook = event.target.value
    console.log("Selected addressBook: " + selectedAddressBook)
  }
  addressBookList.map((addressBook => {
    addressBookListDiv.appendChild(createAddressBookButton(context, addressBook, setButtonOnClickHandler))
  }))

  addressBookListDiv.appendChild(createAddNewAddressBookButton(context))

  return addressBookListDiv
}

const createAddressBookButton = (
  context: DataBrowserContext,
  addressBook: string,
  setButtonOnClickHandler: Function
): HTMLButtonElement => {

  const button = widgets.button(
    context.dom,
    undefined,
    addressBook,
    setButtonOnClickHandler, //sets an onclick event listener
    {
      needsBorder: true,
    }
  )
  button.setAttribute('value', addressBook)

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
