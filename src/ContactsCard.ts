import { DataBrowserContext } from "pane-registry"
import { widgets } from "solid-ui"
import { createContactInAddressBook } from "./contactsHelpers"
import { AddressBookDetails, AddressBooksData, ContactData, GroupData } from "./contactsTypes"
import ContactsModuleRdfLib from "@solid-data-modules/contacts-rdflib"
import { authn } from "solid-logic"
import { mention } from "./buttonsHelper"

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
  addressBookUriSelectorDiv.setAttribute('id', 'contacts-selector-div')

    
  const button = context.dom.getElementById('add-to-contacts-button')
  button.setAttribute('disabled', '')

  const closeButton = context.dom.createElement('button')
  closeButton.classList.add('contactsCloseButton')
  closeButton.innerHTML = 'Close'
  closeButton.onclick = (event) => {
    const elementToClose = context.dom.getElementById('contacts-selector-div')
    elementToClose.remove()
    
    button.removeAttribute('disabled')
  }
  const addressBookDetailsDiv = createAddressBookDetailsDiv(context)
    
  const addressBookListDiv = createAddressBookListDiv(context, contactsModule, contactData, addressBooksData, addressBookDetailsDiv, addressBookUriSelectorDiv)
  addressBookDetailsDiv.appendChild(addressBookListDiv)

  addressBookUriSelectorDiv.appendChild(closeButton)
  addressBookUriSelectorDiv.appendChild(addressBookDetailsDiv)
  addressBookUriSelectorDiv.appendChild(createNewAddressBookForm(context, contactsModule, contactData))
  
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
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData,
  addressBooksData: AddressBooksData,
  addressBookDetailsDiv: HTMLDivElement,
  addressBookUriSelectorDiv: HTMLDivElement
): HTMLDivElement => {
  
  const setButtonOnClickHandler =  (event) => {
    event.preventDefault()
    const selectedAddressBookButton = event.target
    const previouslySelected = selectedAddressBookButton.classList.contains('selectedButton');
    
    // remove the previous groups
    const groupDivToRemove = context.dom.getElementById('group-list')
    if (groupDivToRemove) groupDivToRemove.remove()
    
    // remove presious address book selection bc you can only have one
    const selectedAddressBookElements = context.dom.querySelectorAll('.selectedAddressBook')
    selectedAddressBookElements.forEach((addressBookButton) => {
      addressBookButton.classList.remove("selectedButton", "selectedAddressBook")
    })
    
    if (previouslySelected) {
      selectedAddressBookButton.classList.remove("selectedButton", "selectedAddressBook");
      const groupForm = context.dom.getElementById('new-group-form')
      if (groupForm) groupForm.remove()
      addressBookUriSelectorDiv.appendChild(createNewAddressBookForm(context, contactsModule, contactData))
    } else {
      const addressForm = context.dom.getElementById('new-addressbook-form')
      if (addressForm) addressForm.remove()
      // display group form
      const groupForm = context.dom.getElementById('new-group-form')
      if (!groupForm) addressBookUriSelectorDiv.appendChild(createGroupNameForm(context, contactsModule, contactData))

      selectedAddressBookButton.classList.add("selectedButton", "selectedAddressBook");
      // selected address book code
      const selectedAddressBookUri = event.target.id
      const addressBook = addressBooksData.public.get(selectedAddressBookUri) 
     
      // add groups for addressbook  
      const groupListDiv = createGroupListDiv(context, addressBook)  
      addressBookDetailsDiv.appendChild(groupListDiv)
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

  addressBookListDiv.innerHTML = "Select an address book"
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

  groupListDiv.innerHTML = "Select a group (optional)"
  addressBook.groups.map((group) => {
    groupListDiv.appendChild(createGroupButton(context, group))
  })
  return groupListDiv
}

const createSubmitButton = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData
): HTMLButtonElement => {
  const setButtonOnClickHandler = async (event) => {
    event.preventDefault()

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
  button.setAttribute('type', 'submit')
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

const createNewAddressBookForm = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData
): HTMLFormElement => {
  const newAddressBookEventListener = async (event) => {
    event.preventDefault()    
    let selectedGroupUris = []
    let enteredAddressBookUri = null 

    const addressNameField = context.dom.querySelector('#addressBookNameInput')
    console.log("address name field")
    console.dir(addressNameField)
    // @ts-ignore
    const enteredAddressName = addressNameField.value
    console.log("Entered Name: " + enteredAddressName)

    const selectedresourceTypeRadio = context.dom.querySelector('input[name="address-type"]:checked')
    // @ts-ignore
    const resourceType = selectedresourceTypeRadio.value
    console.log("Resource Type: " + resourceType)
    
    const groupNameField = context.dom.querySelector('#groupNameInput')
    // @ts-ignore
    const enteredGroupName = groupNameField.value

    if (enteredAddressName) {
      // add addressbook first 
      try {
        enteredAddressBookUri = await handleAddressBookCreation(contactsModule, enteredAddressName,resourceType)
        if (enteredGroupName) {
          const newGroupUri = await contactsModule.createNewGroup({addressBookUri: enteredAddressBookUri, groupName: enteredGroupName })
          selectedGroupUris.push(newGroupUri)
        }
        const selectedAddressBookUris = { 
        addressBookUri: enteredAddressBookUri,
        groupUris: selectedGroupUris 
        }
        const contact = await createContactInAddressBook(context, contactsModule, contactData, selectedAddressBookUris)
      } catch (error) {
        throw new Error(error)
      }
    } else {
      mention(event.target, "A address book name is required")
    }
  }   
  const newAddressBookForm = context.dom.createElement('form')
  newAddressBookForm.addEventListener('click', newAddressBookEventListener)
  newAddressBookForm.innerHTML = 'Create a new address book'
  newAddressBookForm.setAttribute('id', 'new-addressbook-form')
  newAddressBookForm.classList.add('contactsNewAddressForm')
  const addressBookNameLabel = context.dom.createElement('label')
  addressBookNameLabel.classList.add('label')
  addressBookNameLabel.setAttribute('for', 'addressBookNameInput')

  const addressBookNameInputBox = context.dom.createElement('input')
  addressBookNameInputBox.type = 'text'
  addressBookNameInputBox.name = 'addressBookName'
  addressBookNameInputBox.id = 'addressBookNameInput' 
  addressBookNameInputBox.placeholder = 'New address book name' 
  addressBookNameInputBox.classList.add('input', 'contactsAddressBookInput')
  addressBookNameInputBox.required = true

  const addressBookTypeDiv = context.dom.createElement('div')
  addressBookTypeDiv.classList.add('contactsAddressTypeInput')

  const addressBookPublicRadioLabel = context.dom.createElement('label')
  addressBookPublicRadioLabel.classList.add('label')
  addressBookPublicRadioLabel.innerHTML = 'Public'
  addressBookPublicRadioLabel.setAttribute('for', 'public')

  const addressBookPublicRadio = context.dom.createElement('input')
  addressBookPublicRadio.type = 'radio';
  addressBookPublicRadio.id = 'public';
  addressBookPublicRadio.name = 'address-type';
  addressBookPublicRadio.value = 'public';
  addressBookPublicRadio.checked = true

  const addressBookPrivateRadioLabel = context.dom.createElement('label')
  addressBookPrivateRadioLabel.classList.add('label')
  addressBookPrivateRadioLabel.innerHTML = 'Private'
  addressBookPrivateRadioLabel.setAttribute('for', 'private')

  const addressBookPrivateRadio = context.dom.createElement('input')
  addressBookPrivateRadio.type = 'radio';
  addressBookPrivateRadio.id = 'private';
  addressBookPrivateRadio.name = 'address-type';
  addressBookPrivateRadio.value = 'private';

  addressBookTypeDiv.appendChild(addressBookPublicRadioLabel)
  addressBookTypeDiv.appendChild(addressBookPublicRadio)
  addressBookTypeDiv.appendChild(addressBookPrivateRadioLabel)
  addressBookTypeDiv.appendChild(addressBookPrivateRadio)

  const groupNameLabel = context.dom.createElement('label')
  groupNameLabel.classList.add('label')
  groupNameLabel.setAttribute('for', 'groupNameInput')

  const groupNameInputBox = context.dom.createElement('input')
  groupNameInputBox.type = 'text'; 
  groupNameInputBox.name = 'groupName'; 
  groupNameInputBox.id = 'groupNameInput'; 
  groupNameInputBox.placeholder = 'New group name (optional)'; 
  groupNameInputBox.classList.add('input', 'contactsGroupInput')
  const submitButton = createSubmitButton(context,contactsModule, contactData)
  
  newAddressBookForm.appendChild(addressBookNameLabel)
  newAddressBookForm.appendChild(addressBookNameInputBox)

  newAddressBookForm.appendChild(addressBookTypeDiv)
  newAddressBookForm.appendChild(groupNameLabel)
  newAddressBookForm.appendChild(groupNameInputBox)
  newAddressBookForm.appendChild(submitButton)
    
  return newAddressBookForm
}

async function handleAddressBookCreation(
  contactsModule: ContactsModuleRdfLib,
  enteredAddressName: string,
  resourceType: string
): Promise<string> {
  const me = authn.currentUser()
  const newAddressContainer = me.site().value 
  let addressBookUri = null

  if (resourceType === 'public') {
    addressBookUri = await contactsModule.createAddressBook({
      containerUri: newAddressContainer,
      name: enteredAddressName
    })
  } else {
      addressBookUri = await contactsModule.createAddressBook({
        containerUri: newAddressContainer,
        name: enteredAddressName,
        ownerWebId: me.uri
      })
  }
  return addressBookUri
}
const createGroupNameForm = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData
): HTMLFormElement => {
  const addContactEventListener = async (event) => {
    event.preventDefault()
    let selectedAddressBookUri = null 
    let selectedGroupUris = []

    const selectedAddressBookElement = context.dom.querySelectorAll('.selectedAddressBook')
    selectedAddressBookElement.forEach((addressBookButton) => {
      selectedAddressBookUri = addressBookButton.getAttribute('id')
    })

    const selectedGroupElements = context.dom.querySelectorAll('.selectedGroup')
    selectedGroupElements.forEach((groupButtons) => {
       selectedGroupUris.push(groupButtons.getAttribute('id'))
    })
    
    const groupNameField = context.dom.querySelector('#groupNameInput')
    // @ts-ignore
    const enteredGroupName = groupNameField.value

    if (enteredGroupName) {
      // add group first 
      try {
        const newGroupUri = await contactsModule.createNewGroup({addressBookUri: selectedAddressBookUri, groupName: enteredGroupName })
        selectedGroupUris.push(newGroupUri)
      } catch (error) {
        throw new Error(error)
      }  
    }
    
    const selectedAddressBookUris = { 
        addressBookUri: selectedAddressBookUri,
        groupUris: selectedGroupUris 
    }
      const contact = await createContactInAddressBook(context, contactsModule, contactData, selectedAddressBookUris)
    }

  const newGroupForm = context.dom.createElement('form')
  newGroupForm.addEventListener('click', addContactEventListener) 
  newGroupForm.innerHTML = 'Create a new group (optional)'
  newGroupForm.setAttribute('id', 'new-group-form')
  newGroupForm.classList.add('contactsNewAddressForm')
  
  const groupNameLabel = context.dom.createElement('label')
  groupNameLabel.classList.add('label')
  groupNameLabel.setAttribute('for', 'groupNameInput')

  const groupNameInputBox = context.dom.createElement('input')
  groupNameInputBox.type = 'text' 
  groupNameInputBox.name = 'groupName' 
  groupNameInputBox.id = 'groupNameInput' 
  groupNameInputBox.placeholder = 'New group name (optional)' 
  groupNameInputBox.classList.add('input', 'contactsGroupInput')
  const submitButton = createSubmitButton(context,contactsModule, contactData)
  
  newGroupForm.appendChild(groupNameLabel)
  newGroupForm.appendChild(groupNameInputBox)
  newGroupForm.appendChild(submitButton)
    
  return newGroupForm
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
