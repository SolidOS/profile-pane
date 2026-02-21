import { DataBrowserContext } from "pane-registry"
import { widgets } from "solid-ui"
import { createContactInAddressBook } from "./contactsHelpers"
import { AddressBookDetails, AddressBooksData, ContactData, GroupData } from "./contactsTypes"
import ContactsModuleRdfLib from "@solid-data-modules/contacts-rdflib"

export const createAddressBookUriSelectorDiv = (context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData,
  addressBooksData: AddressBooksData
): HTMLDivElement => {
  const addressBookUriSelectorDiv = context.dom.createElement('div')
  addressBookUriSelectorDiv.setAttribute('role', 'addressBookSelector')
  addressBookUriSelectorDiv.setAttribute('aria-live', 'polite')
  addressBookUriSelectorDiv.setAttribute('tabindex', '0')
  addressBookUriSelectorDiv.classList.add('contactsAddressBookSelector')

  const addressBookDetailsDiv = createAddressBookDetailsDiv(context)
  const addAddressBookDiv = createNewAddressBookDiv(context, contactsModule, contactData)
  
  const addressBookListDiv = createAddressBookListDiv(context, addressBooksData, addressBookDetailsDiv)
  addressBookDetailsDiv.appendChild(addressBookListDiv)

  addressBookUriSelectorDiv.appendChild(addressBookDetailsDiv)
  addressBookUriSelectorDiv.appendChild(addAddressBookDiv)
  
  return addressBookUriSelectorDiv
}

export const createAddressBookDetailsDiv = (
  context: DataBrowserContext
): HTMLDivElement => {
  const addressBookDetailsDiv = context.dom.createElement('div')
  addressBookDetailsDiv.setAttribute('role', 'addressBookDetails')
  addressBookDetailsDiv.setAttribute('aria-live', 'polite')
  addressBookDetailsDiv.setAttribute('tabindex', '0')
  addressBookDetailsDiv.classList.add('contactsAddressBookDetails')

  return addressBookDetailsDiv
}

export const createAddressBookListDiv = (
  context: DataBrowserContext,
  addressBooksData: AddressBooksData,
  addressBookUriSelectorDiv: HTMLDivElement
): HTMLDivElement => {
  const setButtonOnClickHandler =  (event) => {
    event.preventDefault()

    // remove the previous groups
    const groupDivToRemove = context.dom.getElementById('group-list')
    if (groupDivToRemove) groupDivToRemove.remove()
    
    const selectedAddressBookButton = event.target
    const previouslySelected = selectedAddressBookButton.classList.contains('selectedButton');
    
    if (previouslySelected) {
      selectedAddressBookButton.classList.remove("selectedButton", "selectedAddressBook");
    
    } else {
      // remove presious address book selection bc you can only have one
      const selectedAddressBookElements = context.dom.querySelectorAll('selectedAddressBook')
      selectedAddressBookElements.forEach((addressBookButton) => {
        addressBookButton.classList.remove("selectedButton", "selectedAddressBook");
      })
      
      selectedAddressBookButton.classList.add("selectedButton", "selectedAddressBook");
      // selected address book code
      const selectedAddressBookUri = event.target.id
      const addressBook = addressBooksData.public.get(selectedAddressBookUri) 
     
      // add groups for addressbook  
      const groupListDiv = createGroupListDiv(context, addressBook)  
      addressBookUriSelectorDiv.appendChild(groupListDiv)
    }
  }    
  const addressBookListDiv = context.dom.createElement('div')
  addressBookListDiv.setAttribute('class', 'contactsAddressBookList')
  addressBookListDiv.setAttribute('role', 'addressBooksList')
  addressBookListDiv.setAttribute('aria-live', 'polite')
  addressBookListDiv.setAttribute('tabindex', '0')
  // check if I need below  
  addressBookListDiv.setAttribute('aria-labelledby', 'address-book-list-div')
  addressBookListDiv.setAttribute('data-testid', 'div')

  addressBookListDiv.innerHTML = "Select an address book:"
    addressBooksData.public.forEach((addressBook, addressBookUri) => {
    addressBookListDiv.appendChild(createAddressBookButton(context, addressBook, addressBookUri, 'public', setButtonOnClickHandler))
  })

  addressBooksData.private.forEach((addressBook, addressBookUri) => {
    addressBookListDiv.appendChild(createAddressBookButton(context, addressBook, addressBookUri, 'private', setButtonOnClickHandler))
  })
  
  return addressBookListDiv
}

const createGroupListDiv = (
  context: DataBrowserContext,
  addressBook: AddressBookDetails
): HTMLDivElement => {

  const groupListDiv = context.dom.createElement('div')
  groupListDiv.setAttribute('class', 'contactsGroupList')
  groupListDiv.setAttribute('role', 'groupList')
  groupListDiv.setAttribute('aria-live', 'polite')
  groupListDiv.setAttribute('tabindex', '0')
  // check if I need below
  groupListDiv.setAttribute('aria-labelledby', 'group-list-div')
  groupListDiv.setAttribute('data-testid', 'div')
  groupListDiv.setAttribute('id', 'group-list')

  addressBook.groups.map((group) => {
    groupListDiv.appendChild(createGroupButton(context, group))
  })
  return groupListDiv
}

export const createNewAddressBookDiv = (context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData
): HTMLDivElement => {
  const createNewAddressBookDiv = context.dom.createElement('div')
  createNewAddressBookDiv.setAttribute('role', 'newAddressBook')
  createNewAddressBookDiv.setAttribute('aria-live', 'polite')
  createNewAddressBookDiv.setAttribute('tabindex', '0')
  createNewAddressBookDiv.classList.add('contactsCreateNewAddressBook')
  createNewAddressBookDiv.innerHTML = 'Create New: '
  createNewAddressBookDiv.appendChild(createAddNewAddressBookButton(context))
  createNewAddressBookDiv.appendChild(createSubmitButton(context, contactsModule, contactData))
    
  return createNewAddressBookDiv
}

const createSubmitButton = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData
): HTMLButtonElement => {
  const setButtonOnClickHandler = async (event) => {
    event.preventDefault()
    let selectedAddressBookUri = null 
    let selectedGroupUris = []

    const selectedAddressBookElement = context.dom.querySelectorAll('selectedAddressBook')
    const selectedGroupElements = context.dom.querySelectorAll('selectedGroup')
  
    selectedAddressBookElement.forEach((addressBookButton) => {
      selectedAddressBookUri = addressBookButton.getAttribute('id')
    })

    selectedGroupElements.forEach((groupButtons) => {
       selectedGroupUris.push(groupButtons.getAttribute('id'))
    })

    const selectedAddressBookUris = { 
        addressBookUri: selectedAddressBookUri,
        groupUris: selectedGroupUris 
      }
      const contact = await createContactInAddressBook(contactsModule, contactData, selectedAddressBookUris)
      console.log("contact: " + contact)
  }

  const button = widgets.button(
    context.dom,
    undefined,
    'Add Contact',
    setButtonOnClickHandler, //sets an onclick event listener
    {
      needsBorder: true,
      buttonColor: 'Secondary'
    }
  )
  
  button.setAttribute('id', 'add-contact')
  button.classList.add('contactsSubmitButton', 'actionButton', 'btn-primary', 'action-button-focus')
  
  return button
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
  button.setAttribute('value', addressBook.name)
  button.setAttribute('id', addressBookUri)
  button.classList.add('actionButton', 'btn-primary', 'action-button-focus')
  
  return button
}

const createAddNewGroupButton = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBookUri: string
): HTMLButtonElement => {
  const createGroupNameForm = (): HTMLFormElement => {
    const groupNameForm = context.dom.createElement('form')
    const groupNameInputBox = context.dom.createElement('input')
      groupNameInputBox.type = 'text'; 
      groupNameInputBox.name = 'groupName'; 
      groupNameInputBox.id = 'groupInput'; 
      groupNameInputBox.placeholder = 'Enter group name'; 
      groupNameInputBox.setAttribute('class', 'contactsGroupInput')
    const groupNameSubmitButton = createGroupNameSubmitButton(context, contactsModule, addressBookUri, 'Submit')   
    
    groupNameForm.appendChild(groupNameInputBox)
    groupNameForm.appendChild(groupNameSubmitButton)
    
    return groupNameForm
  }

  const setButtonOnClickHandler = async (event) => {
    event.preventDefault()
    // get group Name from user
    const groupNameInputForm = createGroupNameForm()
    event.target.appendChild(groupNameInputForm)

    // refresh groups with new group appearing
  }

  const button = widgets.button(
    context.dom,
    undefined,
    'Add New Group',
    setButtonOnClickHandler, //sets an onclick event listener
    {
      needsBorder: true
    }
  )
  
  button.setAttribute('id', 'add-new-group')
  button.classList.add('actionButton', 'btn-primary', 'action-button-focus')
  
  return button
}

const createGroupNameSubmitButton = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBookUri: string,
  label: string
): HTMLButtonElement => {
  const setButtonOnClickHandler = (event) => {
    // get value inputed by user
    // const groupName = 
    try {
      // const uri = await contactsModule.createNewGroup(addressBookUri, groupName)
    } catch (error) {
      throw new Error(error)
    }
  }

  const button = widgets.button(
    context.dom,
    undefined,
    label,
    setButtonOnClickHandler, //sets an onclick event listener
    {
      needsBorder: true
    }
  )
  button.setAttribute('id', 'group-name-submit')
  button.classList.add('actionButton', 'btn-primary', 'action-button-focus')
  
  return button
}

const createGroupButton = (
  context: DataBrowserContext,
  group: GroupData
): HTMLButtonElement => {
  const setButtonOnClickHandler = async (event) => {
    event.preventDefault()
    
    const selectedGroupButton = event.target
    const previouslySelected = selectedGroupButton.classList.contains('selectedButton');
    
    if (previouslySelected) {
      selectedGroupButton.classList.remove("selectedButton", "selectedGroup")
    
    } else {
      selectedGroupButton.classList.add("selectedButton", "selectedGroup");
    }
  } 
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
  button.classList.add('actionButton', 'btn-primary', 'action-button-focus')
  
  return button
}

const createAddNewAddressBookButton = (
  context: DataBrowserContext
): HTMLButtonElement => {

  const setButtonOnClickHandler = (event) => {
    event.preventDefault()
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
    "AddressBook",
    setButtonOnClickHandler, //sets an onclick event listener
    {
      needsBorder: true,
    }
  )
  button.setAttribute('id', 'new-address-book')
  button.classList.add('actionButton', 'btn-primary', 'action-button-focus')
  
  return button
}
