import { DataBrowserContext } from "pane-registry"
import { addANewAddressBookUriToAddressBooks, addGroupToAddressBookData, addWebIDToExistingContact, checkIfContactExistsByName, checkIfContactExistsByWebID, createContactInAddressBook, handleAddressBookCreation, refreshButton } from "./contactsHelpers"
import { AddressBookDetails, AddressBooksData, ContactData, GroupData } from "./contactsTypes"
import ContactsModuleRdfLib from "@solid-data-modules/contacts-rdflib"
import { clearPreviousMessage, mention } from "./buttonsHelper"
import { contactExistsMessage, contactWasAddedSuccesMessage, errorContactCreation, errorGroupCreation, errorNotExistsAddressBookUri, groupIsRequired } from "./texts"
import { addErrorToErrorDisplay, checkAndAddErrorDisplay } from "./contactsErrors"

const CONTACTS_POPUP_OVERLAY_ID = 'contacts-popup-overlay'

export const createAddressBookUriSelectorDialog = (context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData,
  addressBooksData: AddressBooksData
): HTMLDialogElement => {
  const addressBookUriSelectorDialog = context.dom.createElement('dialog')
  addressBookUriSelectorDialog.setAttribute('role', 'dialog')
  addressBookUriSelectorDialog.setAttribute('aria-live', 'polite')
  addressBookUriSelectorDialog.classList.add('contactsAddressBookSelector')
  addressBookUriSelectorDialog.setAttribute('id', 'contacts-selector-dialog')

  const button = context.dom.getElementById('add-to-contacts-button')
  button.setAttribute('disabled', '')

  // SAM there may be a close Icon function in solid-ui I can use instead of creating my own. will check and change this if there is one.
  const closeButton = createCloseButton(context, addressBookUriSelectorDialog, 'contactsCloseButton')

  const addressBookCreationDiv = context.dom.createElement('div')
  addressBookCreationDiv.setAttribute('id', 'addressbook-creation-div')
  addressBookCreationDiv.setAttribute('role', 'addressBookCreation')
  addressBookCreationDiv.setAttribute('aria-live', 'polite')
  addressBookCreationDiv.setAttribute('tabindex', '0')
  addressBookCreationDiv.setAttribute('aria-label', 'Address book creation section')
  addressBookCreationDiv.setAttribute('aria-describedby', 'addressbook-details-section')
  addressBookCreationDiv.classList.add('contactsAddressBookCreationDiv')

  const addressBookContactSubmitButton = createNewContactCreationButton(context, contactsModule, addressBooksData, contactData)

  const addressBookDetailsSection = createAddressBookDetailsSection(context)
  const errorDisplaySection = createErrorDisplaySection(context)  
  const addressBookListDiv = createAddressBookListDiv(context, contactsModule, contactData, addressBooksData, addressBookDetailsSection)
  addressBookDetailsSection.appendChild(addressBookListDiv)

  addressBookCreationDiv.appendChild(addressBookDetailsSection)
  addressBookCreationDiv.appendChild(addressBookContactSubmitButton)
  
  addressBookUriSelectorDialog.appendChild(closeButton)
  addressBookUriSelectorDialog.appendChild(addressBookCreationDiv)

  addressBookUriSelectorDialog.appendChild(errorDisplaySection)
 
  return addressBookUriSelectorDialog
}

const createAddressBookDetailsSection = (
  context: DataBrowserContext
): HTMLElement => {
  const addressBookDetailsSection = context.dom.createElement('section')
  addressBookDetailsSection.setAttribute('id', 'addressbook-details-section')
  addressBookDetailsSection.setAttribute('role', 'addressBookDetails')
  addressBookDetailsSection.setAttribute('aria-live', 'polite')
  addressBookDetailsSection.setAttribute('tabindex', '0')
  addressBookDetailsSection.classList.add('contactsAddressBookDetails')

  return addressBookDetailsSection
}

const createAddressBookCreationButton = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  contactData: ContactData
): HTMLButtonElement => {
  const setButtonOnClickHandler = async (event) => { 
    event.preventDefault()
    const newAddressBookForm = createNewAddressBookForm(context, addressBooksData, contactsModule, contactData)
    const addressBookDialog = context.dom.getElementById('contacts-selector-dialog')
    showPopupOverlay(context)
    addressBookDialog.appendChild(newAddressBookForm)
  }

  const addressBookCreationButton = context.dom.createElement('button')
  addressBookCreationButton.setAttribute('id', 'contacts-create-addressbook-button')
  addressBookCreationButton.setAttribute('type', 'button')
  addressBookCreationButton.setAttribute('role', 'button')
  addressBookCreationButton.setAttribute('data-testid', 'button')
  addressBookCreationButton.setAttribute('aria-label', 'Create a new address book')
  addressBookCreationButton.setAttribute('tabindex', '0')
  addressBookCreationButton.textContent = 'Create Address Book'
  addressBookCreationButton.classList.add('contactsActionButton', 'contactsAddressBookCreationButton')
  addressBookCreationButton.addEventListener('click', setButtonOnClickHandler)
  return addressBookCreationButton
}

const createAddressBookUriEntryButton = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  contactData: ContactData
): HTMLButtonElement => {
  const setButtonOnClickHandler = async (event) => { 
    event.preventDefault()
    const addressBookUriSelectorDialog = context.dom.getElementById('contacts-selector-dialog')
    const addressBookUriEntryDiv = createAddressBookUriEntryDiv(context, contactsModule, addressBooksData, contactData)
    showPopupOverlay(context)
    addressBookUriSelectorDialog.appendChild(addressBookUriEntryDiv)
  }
  const addressBookCreationButton = context.dom.createElement('button')
  addressBookCreationButton.setAttribute('id', 'contacts-addressbook-uri-entry-button')
  addressBookCreationButton.setAttribute('type', 'button')
  addressBookCreationButton.setAttribute('role', 'button')
  addressBookCreationButton.setAttribute('data-testid', 'button')
  addressBookCreationButton.setAttribute('aria-label', 'Enter an address book URI to add the contact to a specific address book')
  addressBookCreationButton.setAttribute('tabindex', '0')
  addressBookCreationButton.textContent = 'Enter Address Book URI'
  addressBookCreationButton.classList.add('contactsActionButton', 'contactsAddressBookUriEntryButton')
  addressBookCreationButton.addEventListener('click', setButtonOnClickHandler)
  return addressBookCreationButton
}

const createAddressBookUriEntryDiv = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  contactData: ContactData
): HTMLDivElement => {
  const addressBookUriEntryDiv = context.dom.createElement('div')
  addressBookUriEntryDiv.setAttribute('role', 'addressBookUriEntry')
  addressBookUriEntryDiv.setAttribute('aria-live', 'polite')
  addressBookUriEntryDiv.setAttribute('tabindex', '0')
  addressBookUriEntryDiv.setAttribute('id', 'contacts-addressbook-uri-entry')
  addressBookUriEntryDiv.classList.add('contactsPopupMessage', 'contactsAddressBookUriEntry')

  const closeButton = createCloseButton(context, addressBookUriEntryDiv, 'contactsAddressBookUriEntryCloseButton')
  addressBookUriEntryDiv.appendChild(closeButton)
  
  addressBookUriEntryDiv.appendChild(createAddressBookUriEntryForm(context, contactsModule, addressBooksData, contactData))  
  return addressBookUriEntryDiv
}

const createAddressBookUriEntryForm = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  contactData: ContactData
): HTMLFormElement => {

  const setButtonOnSubmitHandler = async (event) => {
    event.preventDefault()
    const addressBookUriField = context.dom.querySelector('#addressBookUriInput')

    // @ts-ignore
    const enteredAddressBookUri = addressBookUriField.value

    if (!enteredAddressBookUri) {
      addErrorToErrorDisplay(context, errorNotExistsAddressBookUri)
      return
    } else {
        const uriCheck = enteredAddressBookUri.substring(enteredAddressBookUri.length - 5, enteredAddressBookUri.length)
        const normalizedUri = (uriCheck === '#this') ? enteredAddressBookUri : enteredAddressBookUri + '#this'
        const books =  await addANewAddressBookUriToAddressBooks(context, contactsModule, addressBooksData, normalizedUri)
        
        const addressBookListDiv = context.dom.querySelector('#addressbook-list')
        if (addressBookListDiv) {
          // SAM when I add the screen over the dialog I need to remove it.
          const addressBookUriEntry = context.dom.getElementById('contacts-addressbook-uri-entry')
          addressBookUriEntry.remove()
          removePopupOverlayIfNoPopup(context)
          //SAM remove buttons if we leave them in address list
          addressBookListDiv.appendChild(createAddressBookButton(context, contactsModule, books.addressBooksData, books.addressBook, enteredAddressBookUri, contactData, 'private'))
          // SAM then readd them
        }}

  }

  const inputAddressUriEventListener = () => { 
    checkAndRemoveErrorDisplay(context)
  }
  const addressBookUriEntryForm = context.dom.createElement('form')
  addressBookUriEntryForm.setAttribute('id', 'contacts-address-uri-entry-form')
  addressBookUriEntryForm.classList.add('contactsAddressBookUriEntryForm')
  addressBookUriEntryForm.method = 'post'
  addressBookUriEntryForm.addEventListener('submit', setButtonOnSubmitHandler)

  const addressBookUriEntryLabel = context.dom.createElement('label')
  addressBookUriEntryLabel.classList.add('label')
  addressBookUriEntryLabel.setAttribute('for', 'addressBookUriInput')

  const addressBookNameInputBox = context.dom.createElement('input')
  addressBookNameInputBox.type = 'text'
  addressBookNameInputBox.name = 'addressBookUri'
  addressBookNameInputBox.id = 'addressBookUriInput' 
  addressBookNameInputBox.placeholder = 'Enter address book URI to find your address book' 
  addressBookNameInputBox.classList.add('input', 'contactsAddressBookUriInput')
  addressBookNameInputBox.addEventListener('click', inputAddressUriEventListener)
  
  addressBookUriEntryForm.appendChild(addressBookUriEntryLabel)
  addressBookUriEntryForm.appendChild(addressBookNameInputBox)
  addressBookUriEntryForm.appendChild(createAddressBookUriEntryAddButton(context))
  
  return addressBookUriEntryForm
}

const createAddressBookUriEntryAddButton = (
  context: DataBrowserContext
): HTMLButtonElement => {

  const setButtonOnClickHandler = async (event) => {
    event.preventDefault()
    const addressBookUriEntryForm = context.dom.querySelector('#contacts-address-uri-entry-form') 
    // @ts-ignore
    if (addressBookUriEntryForm) addressBookUriEntryForm.requestSubmit()
  }

  const entryButton = context.dom.createElement('button')
  entryButton.setAttribute('id', 'contacts-addressbook-entry-button')
  entryButton.setAttribute('role', 'button')
  entryButton.setAttribute('data-testid', 'button')
  entryButton.setAttribute('aria-label', 'Create Address Book from entered URI')
  entryButton.setAttribute('tabindex', '0')
  entryButton.classList.add('contactsActionButton', 'contactsAddressBookUriEntryAddButton')
  entryButton.setAttribute('type', 'submit')
  entryButton.addEventListener('click', setButtonOnClickHandler)
  entryButton.innerHTML = 'Add'
  return entryButton
}

const createAddressBookListDiv = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData,
  addressBooksData: AddressBooksData,
  addressBookDetailsSection: HTMLElement
): HTMLDivElement => {

  const addressBookListDiv = context.dom.createElement('div')
  addressBookListDiv.setAttribute('class', 'contactsAddressBookList')
  addressBookListDiv.setAttribute('role', 'addressBooksList')
  addressBookListDiv.setAttribute('aria-live', 'polite')
  addressBookListDiv.setAttribute('tabindex', '0')
  addressBookListDiv.setAttribute('id', 'addressbook-list')
  // check if I need below  
  addressBookListDiv.setAttribute('aria-labelledby', 'address-book-list-div')
  addressBookListDiv.setAttribute('data-testid', 'div')

  addressBookListDiv.innerHTML = "Address Books"
  addressBooksData.public.forEach((addressBook, addressBookUri) => {
    addressBookListDiv.appendChild(createAddressBookButton(context, contactsModule, addressBooksData, addressBook, addressBookUri, contactData, 'public'))
  })

  addressBooksData.private.forEach((addressBook, addressBookUri) => {
    addressBookListDiv.appendChild(createAddressBookButton(context, contactsModule, addressBooksData, addressBook, addressBookUri, contactData, 'private'))
  })
  const addressBookCreationButton = createAddressBookCreationButton(context, contactsModule, addressBooksData, contactData)
  const addressBookUriEntryButton = createAddressBookUriEntryButton(context, contactsModule, addressBooksData, contactData)

  addressBookListDiv.appendChild(addressBookCreationButton)
  addressBookListDiv.appendChild(addressBookUriEntryButton)
  return addressBookListDiv
}

const createAddressBookGroupCreationButton = (
  context: DataBrowserContext, 
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  contactData: ContactData
): HTMLButtonElement => {
  const setButtonOnClickHandler = async (event) => { 
    event.preventDefault()
    const addressBookDialog = context.dom.getElementById('contacts-selector-dialog')
    const groupNameForm = context.dom.getElementById('new-group-form')
    if (!groupNameForm) {
      showPopupOverlay(context)
      addressBookDialog.appendChild(createGroupNameForm(context, contactsModule, addressBooksData, contactData))
    }
  }
  const groupCreationButton = context.dom.createElement('button')
  groupCreationButton.setAttribute('id', 'contacts-create-group-button')
  groupCreationButton.setAttribute('type', 'button')
  groupCreationButton.setAttribute('role', 'button')
  groupCreationButton.setAttribute('data-testid', 'button')
  groupCreationButton.setAttribute('aria-label', 'Create a new group in the selected address book')
  groupCreationButton.setAttribute('tabindex', '0')
  groupCreationButton.textContent = 'Create Group'
  groupCreationButton.classList.add('contactsActionButton', 'contactsCreateGroupCreationButton')
  groupCreationButton.addEventListener('click', setButtonOnClickHandler)
  return groupCreationButton
}

const createGroupListDiv = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  addressBook: AddressBookDetails,
  contactData: ContactData
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

  groupListDiv.innerHTML = "Groups"
  if (addressBook) {
    addressBook.groups.map((group) => {
        groupListDiv.appendChild(createGroupButton(context, group))
    })
  } 
  groupListDiv.appendChild(createAddressBookGroupCreationButton(context, contactsModule, addressBooksData, contactData))
  return groupListDiv
}

const createErrorDisplaySection = (
  context: DataBrowserContext
): HTMLElement => {
  const setButtonOnClickHandler = (event) => {
    event.preventDefault()
    errorDisplaySection.classList.remove('contactsShowErrors')
  }

  const errorDisplaySection = context.dom.createElement('section')
  errorDisplaySection.classList.add('contactsErrorDisplay')
  errorDisplaySection.setAttribute('id', 'error-display-section')
  const closeButton = context.dom.createElement('button')
  closeButton.classList.add('contactsCloseErrorDisplayButton')
  closeButton.textContent = 'x'
  closeButton.addEventListener('click', setButtonOnClickHandler)
  errorDisplaySection.appendChild(closeButton)
  return errorDisplaySection
}

const checkAndRemoveErrorDisplay = (
  context: DataBrowserContext
) => {
  const errorDisplaySection = context.dom.getElementById('error-display-section')
  if (errorDisplaySection.classList.contains('contactsShowErrors')) {
    errorDisplaySection.classList.remove('contactsShowErrors')
    errorDisplaySection.innerHTML = ''
  }
}

const createNewContactCreationButton = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  contactData: ContactData
): HTMLButtonElement => {
  const setButtonOnClickHandler = async (event) => {
    event.preventDefault()

    const contactExistsByWebID = checkIfContactExistsByWebID(addressBooksData, contactData.webID)
    const contactExistsByName = checkIfContactExistsByName(addressBooksData, contactData.name)
    const contactExistsHandled = handleContactExists(
      context,
      contactsModule,
      addressBooksData,
      contactData,
      contactExistsByWebID,
      contactExistsByName
    )
    if (contactExistsHandled) return
    
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
    
    if (selectedGroupUris.length) {
    
      const selectedAddressBookUris = { 
          addressBookUri: selectedAddressBookUri,
          groupUris: selectedGroupUris 
      }

      try {
        const contactUri = await createContactInAddressBook(context, contactsModule, addressBooksData, contactData, selectedAddressBookUris)
        finalizeContactEntry(context, addressBooksData, contactData, contactUri)
      } catch(error) {
        addErrorToErrorDisplay(context, `${errorContactCreation}\n${error}`)
      }
    } else {
      addErrorToErrorDisplay(context, groupIsRequired)
    }
  }
/*
  const button = widgets.button(
    context.dom,
    undefined,
    'Add Contact',
    setButtonOnClickHandler, //sets an onclick event listener
    {
      needsBorder: true,
      buttonColor: 'Secondary'
    }
  ) */
  const button = context.dom.createElement('button')
  button.setAttribute('type', 'submit')
  button.setAttribute('id', 'add-contact')
  button.setAttribute('role', 'button')
  button.setAttribute('data-testid', 'button')
  button.setAttribute('aria-label', 'Create a new address book')
  button.setAttribute('tabindex', '0')
  button.classList.add('contactsActionButton', 'contactsNewContactCreationButton')
  button.addEventListener('click', setButtonOnClickHandler)
  //button.classList.add('contactsSubmitButton', 'actionButton', 'btn-primary', 'action-button-focus')
  button.attributeStyleMap.clear()
  button.textContent = 'Add Contact'
  return button
}

const createAddressBookButton = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  addressBook: AddressBookDetails,
  addressBookUri: string,
  contactData: ContactData,
  index: string,
): HTMLButtonElement => {
  
  const setButtonOnClickHandler =  (event) => {
    event.preventDefault()
    const selectedAddressBookButton = event.target
    const previouslySelected = selectedAddressBookButton.classList.contains('contactsSelectedButton');
    const addressBookDetailsSection = context.dom.getElementById('addressbook-details-section')
    
    let addressBook = null
    // remove the previous groups
    const groupDivToRemove = context.dom.getElementById('group-list')
    if (groupDivToRemove) groupDivToRemove.remove()
    
    // remove presious address book selection bc you can only have one
    const selectedAddressBookElements = context.dom.querySelectorAll('.selectedAddressBook')
    selectedAddressBookElements.forEach((addressBookButton) => {
      addressBookButton.classList.remove("contactsSelectedButton", "selectedAddressBook")
    })
    
    if (previouslySelected) {
      selectedAddressBookButton.classList.remove("contactsSelectedButton", "selectedAddressBook");
      const groupForm = context.dom.getElementById('new-group-form')
      if (groupForm) {
        groupForm.remove()
        removePopupOverlayIfNoPopup(context)
      }
      // SAM no longer want to pop up the create address book form. only do this when
    // only do this when they click on create new address book button
      // addressBookUriSelectorDialog.appendChild(createNewAddressBookForm(context, addressBooksData, contactsModule, contactData)) 
    } else {
      const addressForm = context.dom.getElementById('new-addressbook-form')
      if (addressForm) {
        addressForm.remove()
        removePopupOverlayIfNoPopup(context)
      }
      // display group form
      const groupForm = context.dom.getElementById('new-group-form')
    
      if (!groupForm) // SAM addressBookDetailsSection.appendChild(createGroupNameForm(context, addressBooksData, contactsModule, contactData))

      selectedAddressBookButton.classList.add("contactsSelectedButton", "selectedAddressBook");
      // selected address book code
      const selectedAddressBookUri = event.target.id
      // can check for the class on private
      addressBook = addressBooksData.public.get(selectedAddressBookUri) 
      if (!addressBook) addressBook = addressBooksData.private.get(selectedAddressBookUri) 
      
      // remove the previous groups
      const groupDivToRemove = context.dom.getElementById('group-list')
      if (groupDivToRemove) groupDivToRemove.remove()
      // add groups for addressbook    
      const groupListDiv = createGroupListDiv(context, contactsModule, addressBooksData, addressBook, contactData)  
      addressBookDetailsSection.appendChild(groupListDiv)
    }
  }
  const options = (index === 'private') ? { needsBorder: true, buttonColor: 'Secondary'} : { needsBorder: true }
  /* const button = widgets.button(
    context.dom,
    undefined,
    `${addressBook.name}(${index})`,
    setButtonOnClickHandler, //sets an onclick event listener
    options
  ) */
  const button = context.dom.createElement('button')
  button.setAttribute('value', addressBook.name)
  button.setAttribute('id', addressBookUri)
  button.classList.add('contactsButton')
  // @ts-ignore
  button.addEventListener('click', setButtonOnClickHandler)
  // button.attributeStyleMap.clear()
  button.innerHTML = addressBook.name
  return button
}

const createNewAddressBookForm = (
  context: DataBrowserContext,
  addressBooksData: AddressBooksData,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData
): HTMLFormElement => {
  const newAddressBookEventListener = async (event) => {
    event.preventDefault()    
    let enteredAddressBookUri = null 
    let newGroupUri = null

    const addressNameField = context.dom.querySelector('#addressBookNameInput')

    // @ts-ignore
    const enteredAddressName = addressNameField.value

    const addressContainerField = context.dom.querySelector('#addressBookContainerInput')

    // will use this later, hoping solid-data-modules will handle it
    // @ts-ignore
    const enteredAddressContainer = addressContainerField.value

    const selectedResourceTypeRadio = context.dom.querySelector('input[name="address-type"]:checked')
    // @ts-ignore
    const resourceType = selectedResourceTypeRadio.value
    
    const selectedTypeIndexRadio = context.dom.querySelector('input[name="address-type-index"]:checked')
    // @ts-ignore
    const typeIndex = selectedTypeIndexRadio ? selectedTypeIndexRadio.value : null

    const groupNameField = context.dom.querySelector('#groupNameInput')
    // @ts-ignore
    const enteredGroupName = groupNameField.value

    if (enteredAddressName) {
      // add addressbook first 
      try {
        enteredAddressBookUri = await handleAddressBookCreation(context, contactsModule, enteredAddressContainer, enteredAddressName,resourceType, typeIndex)
        const books =  await addANewAddressBookUriToAddressBooks(context, contactsModule, addressBooksData, enteredAddressBookUri)
        
        if (enteredGroupName) {
          newGroupUri = await contactsModule.createNewGroup({addressBookUri: enteredAddressBookUri, groupName: enteredGroupName })
          const groupAdded = await addGroupToAddressBookData(addressBooksData, enteredAddressBookUri, { name: enteredGroupName, uri: newGroupUri })
          if (!groupAdded) {
            addErrorToErrorDisplay(context, errorGroupCreation)
          }
        }
   
        const addressBookListDiv = context.dom.querySelector('#addressbook-list')
        const groupListDiv = context.dom.querySelector('#group-list')
          
        if (addressBookListDiv) {
          // SAM when I add the screen over the dialog I need to remove it.
          newAddressBookForm.remove()
          removePopupOverlayIfNoPopup(context)
          const addressBookCreationButton = context.dom.getElementById('contacts-create-addressbook-button')
          const addressBookUriEntryButton = context.dom.getElementById('contacts-addressbook-uri-entry-button') 
          addressBookCreationButton.remove()
          addressBookUriEntryButton.remove()
          addressBookListDiv.appendChild(createAddressBookButton(context, contactsModule, addressBooksData, books.addressBook, enteredAddressBookUri, contactData, resourceType)) 
          addressBookListDiv.appendChild(addressBookCreationButton)
          addressBookListDiv.appendChild(addressBookUriEntryButton)
        }
        if (groupListDiv) {
          const groupCreationButton = context.dom.getElementById('contacts-create-group-button')
          groupCreationButton.remove()
          groupListDiv.appendChild(createGroupButton(context, {uri: newGroupUri, name: enteredGroupName}))
          groupListDiv.appendChild(groupCreationButton)
        }
      } catch (error) {
        addErrorToErrorDisplay(context, error)
      }
  
    } 
  }   

  const submitFormEventListener = (event) => {
    event.preventDefault()
    newAddressBookForm.requestSubmit()
  }

  const newAddressBookForm = context.dom.createElement('form')
  newAddressBookForm.method = 'post'
  newAddressBookForm.innerHTML = 'Create a new address book'
  newAddressBookForm.setAttribute('id', 'new-addressbook-form')
  newAddressBookForm.classList.add('contactsPopupMessage', 'contactsNewAddressForm')
  
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

  const addressBookContainerLabel = context.dom.createElement('label')
  addressBookContainerLabel.classList.add('label')
  addressBookContainerLabel.setAttribute('for', 'addressBookContainerInput')

  const addressBookContainerInputBox = context.dom.createElement('input')
  addressBookContainerInputBox.type = 'text'
  addressBookContainerInputBox.name = 'addressBookContainer'
  addressBookContainerInputBox.id = 'addressBookContainerInput' 
  addressBookContainerInputBox.placeholder = 'Address book container' 
  addressBookContainerInputBox.classList.add('input', 'contactsAddressBookInput')
  addressBookContainerInputBox.required = true

  const addressBookTypeDiv = context.dom.createElement('div')
  addressBookTypeDiv.classList.add('contactsAddressTypeInput')
  addressBookTypeDiv.setAttribute('role', 'radiogroup')

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

  const addressBookTypeIndexDiv = context.dom.createElement('div')
  addressBookTypeIndexDiv.setAttribute('id', 'addressBookTypeIndexDiv')
  addressBookTypeIndexDiv.setAttribute('role', 'radiogroup')
  addressBookTypeIndexDiv.classList.add('contactsAddressTypeIndexInput')
  addressBookTypeIndexDiv.innerHTML = 'Make your address book findable by others'

  const addressBookTypeIndexOptionsDiv = context.dom.createElement('div')
  addressBookTypeIndexOptionsDiv.classList.add('contactsAddressTypeIndexOptions')

  const addressBookTypeIndexRadioLabel = context.dom.createElement('label')
  addressBookTypeIndexRadioLabel.classList.add('contactsRadioLabel')
  addressBookTypeIndexRadioLabel.innerHTML = 'Yes'
  addressBookTypeIndexRadioLabel.setAttribute('for', 'yes')

  const addressBookTypeIndexRadio = context.dom.createElement('input')
  addressBookTypeIndexRadio.classList.add('contactsRadioInput')
  addressBookTypeIndexRadio.type = 'radio';
  addressBookTypeIndexRadio.id = 'yes';
  addressBookTypeIndexRadio.name = 'address-type-index';
  addressBookTypeIndexRadio.value = 'yes';

  const addressBookNoTypeIndexRadioLabel = context.dom.createElement('label')
  addressBookNoTypeIndexRadioLabel.classList.add('contactsRadioLabel')
  addressBookNoTypeIndexRadioLabel.innerHTML = 'No'
  addressBookNoTypeIndexRadioLabel.setAttribute('for', 'no')

  const addressBookNoTypeIndexRadio = context.dom.createElement('input')
  addressBookNoTypeIndexRadio.classList.add('contactsRadioInput')
  addressBookNoTypeIndexRadio.type = 'radio';
  addressBookNoTypeIndexRadio.id = 'no';
  addressBookNoTypeIndexRadio.name = 'address-type-index';
  addressBookNoTypeIndexRadio.value = 'no';

  addressBookTypeIndexOptionsDiv.appendChild(addressBookTypeIndexRadioLabel)
  addressBookTypeIndexOptionsDiv.appendChild(addressBookTypeIndexRadio)
  addressBookTypeIndexOptionsDiv.appendChild(addressBookNoTypeIndexRadioLabel)
  addressBookTypeIndexOptionsDiv.appendChild(addressBookNoTypeIndexRadio)
  addressBookTypeIndexDiv.appendChild(addressBookTypeIndexOptionsDiv)

  const groupNameLabel = context.dom.createElement('label')
  groupNameLabel.classList.add('label')
  groupNameLabel.setAttribute('for', 'groupNameInput')

  const groupNameInputBox = context.dom.createElement('input')
  groupNameInputBox.type = 'text'; 
  groupNameInputBox.name = 'groupName'; 
  groupNameInputBox.id = 'groupNameInput'; 
  groupNameInputBox.placeholder = 'New group name'; 
  groupNameInputBox.classList.add('input', 'contactsGroupInput')
  groupNameInputBox.required = true

  const submitButton = context.dom.createElement('button')
  submitButton.setAttribute('id', 'submit-addressbook')
  submitButton.setAttribute('role', 'button') 
  submitButton.setAttribute('type', 'submit')
  submitButton.setAttribute('data-testid', 'button')
  submitButton.setAttribute('aria-label', 'Create a new address book with the entered name, container, type and group')
  submitButton.setAttribute('tabindex', '0')
  submitButton.classList.add('contactsActionButton', 'contactsAddressBookCreationSubmitButton')
  submitButton.addEventListener('click', submitFormEventListener)
  submitButton.innerHTML = 'Create Address Book' 
  
  const closeButton = createCloseButton(context, newAddressBookForm, 'contactsAddressBookCreationCloseButton')

  newAddressBookForm.appendChild(closeButton)

  newAddressBookForm.appendChild(addressBookNameLabel)
  newAddressBookForm.appendChild(addressBookNameInputBox)

  newAddressBookForm.appendChild(addressBookContainerLabel)
  newAddressBookForm.appendChild(addressBookContainerInputBox)

  newAddressBookForm.appendChild(addressBookTypeDiv)
  newAddressBookForm.appendChild(addressBookTypeIndexDiv)
  newAddressBookForm.appendChild(groupNameLabel)
  newAddressBookForm.appendChild(groupNameInputBox)
  newAddressBookForm.appendChild(submitButton)
  newAddressBookForm.addEventListener('submit', newAddressBookEventListener)
    
  return newAddressBookForm
}

const createCloseButton = (
  context: DataBrowserContext,
  element: HTMLElement,
  specialClass: string
): HTMLButtonElement => {

  const setButtonOnClickHandler = (event) => {
    event.preventDefault()
    if (element) {
      element.remove()
      removePopupOverlayIfNoPopup(context)
    }
    if (specialClass === 'contactsCloseButton') {
      const button = context.dom.getElementById('add-to-contacts-button')
      if (button) button.removeAttribute('disabled')
    }
  }

  const closeButton = context.dom.createElement('button')
  closeButton.setAttribute('id', 'close-addressbook')
  closeButton.setAttribute('role', 'button')
  closeButton.setAttribute('type', 'button')
  closeButton.setAttribute('data-testid', 'button')
  closeButton.setAttribute('aria-label', 'Cancel the creation of a new address book')
  closeButton.setAttribute('tabindex', '0')
  closeButton.classList.add('contactsCloseButton', specialClass)
  closeButton.addEventListener('click', setButtonOnClickHandler)
  closeButton.innerHTML = 'x' 
  return closeButton
}   

const createGroupNameForm = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData, 
  contactData: ContactData
): HTMLFormElement => {

  const submitFormEventListener = (event) => {
    event.preventDefault()
    newGroupForm.requestSubmit()
  }

  const addGroupEventListener = async (event) => {
    event.preventDefault()
    let selectedAddressBookUri = null 

    const selectedAddressBookElement = context.dom.querySelectorAll('.selectedAddressBook')
    selectedAddressBookElement.forEach((addressBookButton) => {
      selectedAddressBookUri = addressBookButton.getAttribute('id')
    })
    
    const groupNameField = context.dom.querySelector('#groupNameInput')
    // @ts-ignore
    const enteredGroupName = groupNameField.value

    if (!selectedAddressBookUri) {
      addErrorToErrorDisplay(context, errorNotExistsAddressBookUri)
      return
    }

    if (enteredGroupName) {
      // add group first 
      try {
        const newGroupUri = await contactsModule.createNewGroup({addressBookUri: selectedAddressBookUri, groupName: enteredGroupName })
        const newGroup = { name: enteredGroupName, uri: newGroupUri }
        const wasUpdated = addGroupToAddressBookData(addressBooksData, selectedAddressBookUri, newGroup)
        if (!wasUpdated) {
          addErrorToErrorDisplay(context, errorNotExistsAddressBookUri)
          return
        }
        
        const removeGroupAddButton = context.dom.getElementById('contacts-create-group-button')
        if (removeGroupAddButton) removeGroupAddButton.remove()

        const groupListDiv = context.dom.querySelector('#group-list')
        if (groupListDiv) {
          groupListDiv.appendChild(createGroupButton(context, newGroup))
          groupListDiv.appendChild(createAddressBookGroupCreationButton(context, contactsModule, addressBooksData, contactData))
        } 
        newGroupForm.remove()
        removePopupOverlayIfNoPopup(context)
      } catch (error) {
        addErrorToErrorDisplay(context, `${errorGroupCreation}\n${error}`)
      }  
    }
  } 
  
  const newGroupForm = context.dom.createElement('form')
  newGroupForm.addEventListener('submit', addGroupEventListener) 
  newGroupForm.innerHTML = 'Create a new group'
  newGroupForm.setAttribute('id', 'new-group-form')
  newGroupForm.classList.add('contactsPopupMessage', 'contactsNewGroupForm')
  
  const groupNameLabel = context.dom.createElement('label')
  groupNameLabel.classList.add('label')
  groupNameLabel.setAttribute('for', 'groupNameInput')

  const groupNameInputBox = context.dom.createElement('input')
  groupNameInputBox.type = 'text' 
  groupNameInputBox.name = 'groupName' 
  groupNameInputBox.id = 'groupNameInput' 
  groupNameInputBox.placeholder = 'New group name' 
  groupNameInputBox.classList.add('input', 'contactsGroupInput')
 
  const submitButton = context.dom.createElement('button')
  // SAM need to add other attributes potentially move to it's own function.
  submitButton.setAttribute('id', 'submit-group')
  submitButton.setAttribute('role', 'button') 
  submitButton.setAttribute('type', 'submit')
  submitButton.setAttribute('data-testid', 'button')
  submitButton.setAttribute('aria-label', 'Create a new group in the selected address book')
  submitButton.setAttribute('tabindex', '0')
  submitButton.classList.add('contactsActionButton', 'contactsGroupCreationSubmitButton')
  submitButton.addEventListener('click', submitFormEventListener)
  submitButton.innerHTML = 'Add Group' 

  const closeButton = createCloseButton(context, newGroupForm, 'contactsGroupCreationCloseButton')

  newGroupForm.appendChild(groupNameLabel)
  newGroupForm.appendChild(groupNameInputBox)
  newGroupForm.appendChild(submitButton)
  newGroupForm.appendChild(closeButton)
    
  return newGroupForm
}

const handleContactExists = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  contactData: ContactData,
  contactExistsByWebID: boolean,
  contactExistsByName: string,
): boolean => {

  if (contactExistsByWebID) {
      addErrorToErrorDisplay(context, contactExistsMessage )
      return true
    } else if (contactExistsByName) {
      // need to disable and possibly grey out the dialog
      const selectorDialog = context.dom.getElementById('contacts-selector-dialog')
      
      const contactExistsDiv = context.dom.createElement('div')
      contactExistsDiv.setAttribute('role', 'alert')
      contactExistsDiv.setAttribute('aria-live', 'assertive')
      contactExistsDiv.classList.add('contactsContactExistsAlert')
      contactExistsDiv.innerHTML = `${contactData.name} already exists. \n Do you want to add their WebID?`
      
      const confirmButton = context.dom.createElement('button')
      confirmButton.classList.add('contactsConfirmButton')
      confirmButton.innerHTML = 'Yes'
      confirmButton.addEventListener('click', async (event) => {
        event.preventDefault()
        await addWebIDToExistingContact(context, contactsModule, addressBooksData, contactData.webID, contactExistsByName)
        finalizeContactEntry(context, addressBooksData, contactData, addressBooksData.contactWebIDs.get(contactData.webID))
        refreshButton(context, addressBooksData, contactData)  
      })

      const cancelButton = context.dom.createElement('button')
      cancelButton.classList.add('contactsCancelButton')
      cancelButton.innerHTML = 'No'
      cancelButton.addEventListener('click', (event) => {
        event.preventDefault()
        selectorDialog.remove()
        // need to use complain function to display that contact was not added instead of mention
        mention(getButtonContainer(context), "Contact was not added")
        setTimeout(() => {
          clearPreviousMessage(getButtonContainer(context))
        }, 2000); 
          refreshButton(context, addressBooksData, contactData)  
      })

      const actionsDiv = context.dom.createElement('div')
      actionsDiv.classList.add('contactsContactExistsActions')
      actionsDiv.appendChild(confirmButton)
      actionsDiv.appendChild(cancelButton)

      contactExistsDiv.appendChild(actionsDiv)
      showPopupOverlay(context)
      selectorDialog.appendChild(contactExistsDiv)
      return true
    }

    return false
}

const finalizeContactEntry = (
  context: DataBrowserContext,
  addressBooksData: AddressBooksData,
  contactData: ContactData,
  contactUri: string,
) => {
    addressBooksData.contactWebIDs.set(contactData.webID, contactUri)
    const selectorDialog = context.dom.getElementById('contacts-selector-dialog')
    selectorDialog.remove()
    
    const buttonContainer = getButtonContainer(context)
    mention(buttonContainer, contactWasAddedSuccesMessage)
    const button = context.dom.getElementById('add-to-contacts-button')
    button.removeAttribute('disabled')  
    setTimeout(() => {
      clearPreviousMessage(buttonContainer)
    }, 2000); 
    refreshButton(context, addressBooksData, contactData)  
}

const createGroupButton = (
  context: DataBrowserContext,
  group: GroupData
): HTMLButtonElement => {
  const setButtonOnClickHandler = async (event) => {
    event.preventDefault()
    
    const selectedGroupButton = event.target
    const previouslySelected = selectedGroupButton.classList.contains('contactsSelectedButton');
    
    if (previouslySelected) {
      selectedGroupButton.classList.remove("contactsSelectedButton", "selectedGroup")
      checkAndAddErrorDisplay(context, groupIsRequired)
    } else {
      selectedGroupButton.classList.add("contactsSelectedButton", "selectedGroup");
      checkAndRemoveErrorDisplay(context)
    }
  } 
  /*
  const button = widgets.button(
    context.dom,
    undefined,
    group.name,
    setButtonOnClickHandler, //sets an onclick event listener
    {
      needsBorder: true
    }
  ) */
  const button = context.dom.createElement('button')
  button.setAttribute('value', group.name)
  button.setAttribute('id', group.uri)
  button.classList.add('contactsButton')
  button.addEventListener('click', setButtonOnClickHandler)
  button.attributeStyleMap.clear()
  button.innerHTML = group.name

  return button
}

export function getButtonContainer(
  context: DataBrowserContext
): HTMLDivElement {

  const buttonContainer = context.dom.getElementById('add-to-contacts-button-container')
  return buttonContainer as HTMLDivElement
}

const showPopupOverlay = (
  context: DataBrowserContext
): void => {
  const selectorDialog = context.dom.getElementById('contacts-selector-dialog')
  if (!selectorDialog) return

  const existingOverlay = selectorDialog.querySelector(`#${CONTACTS_POPUP_OVERLAY_ID}`)
  if (existingOverlay) return

  const overlay = context.dom.createElement('div')
  overlay.setAttribute('id', CONTACTS_POPUP_OVERLAY_ID)
  overlay.classList.add('contactsPopupOverlay')
  selectorDialog.appendChild(overlay)
}

const removePopupOverlayIfNoPopup = (
  context: DataBrowserContext
): void => {
  const selectorDialog = context.dom.getElementById('contacts-selector-dialog')
  if (!selectorDialog) return

  const activePopup = selectorDialog.querySelector('.contactsPopupMessage, .contactsContactExistsAlert')
  if (activePopup) return

  const overlay = selectorDialog.querySelector(`#${CONTACTS_POPUP_OVERLAY_ID}`)
  if (overlay) overlay.remove()
}
