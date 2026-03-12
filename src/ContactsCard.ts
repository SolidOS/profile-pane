import { DataBrowserContext } from 'pane-registry'
import { addANewAddressBookUriToAddressBooks, addGroupToAddressBookData, addWebIDToExistingContact, checkIfContactExistsByName, checkIfContactExistsByWebID, createContactInAddressBook, handleAddressBookCreation, refreshButton } from './contactsHelpers'
import { AddressBookDetails, AddressBooksData, ContactData, GroupData } from './contactsTypes'
import ContactsModuleRdfLib from '@solid-data-modules/contacts-rdflib'
import { saveNewGroup } from 'contacts-pane'
import { clearPreviousMessage, complain, mention } from './buttonsHelper'
import { contactExistsMessage, contactWasAddedSuccesMessage, errorContactCreation, errorGroupCreation, errorNotExistsAddressBookUri, groupIsRequired } from './texts'
import { addErrorToErrorDisplay, checkAndAddErrorDisplay } from './contactsErrors'
import { NamedNode } from 'rdflib'

const CONTACTS_POPUP_OVERLAY_ID = 'contacts-popup-overlay'
const CONTACTS_OVERLAY_ACTIVE_CLASS = 'contactsOverlayActive'

export const createAddressBookContactCreationDialog = (context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData,
  addressBooksData: AddressBooksData
): HTMLDialogElement => {
  const addressBookContactCreationDialog = context.dom.createElement('dialog')
  addressBookContactCreationDialog.setAttribute('aria-label', 'Address book picker dialog for contact creation.')
  addressBookContactCreationDialog.setAttribute('aria-describedby', 'addressbook-contacts-picker-dialog')
  addressBookContactCreationDialog.classList.add('contactsAddressBookPickerDialog')
  addressBookContactCreationDialog.setAttribute('id', 'contacts-addressbook-picker-dialog')

  const button = context.dom.getElementById('add-to-contacts-button')
  button.setAttribute('disabled', '')

  const closeButton = createCloseButton(context, addressBookContactCreationDialog, 'contactsCloseButton')

  const addressBookContactCreationDiv = context.dom.createElement('section')
  addressBookContactCreationDiv.setAttribute('aria-label', 'Contact Creation Section')
  addressBookContactCreationDiv.setAttribute('aria-describedby', 'addressbook-contact-creation')
  addressBookContactCreationDiv.classList.add('contactsAddressBookContactCreationSection')

  const addressBookContactSubmitButton = createNewContactCreationButton(context, contactsModule, addressBooksData, contactData)

  const addressBookDetailsSection = createAddressBookDetailsSection(context)
  const errorDisplaySection = createErrorDisplaySection(context)  
  const statusRegion = createContactsStatusRegion(context)
  const addressBookListDiv = createAddressBookListDiv(context, contactsModule, contactData, addressBooksData, addressBookDetailsSection)
  addressBookDetailsSection.appendChild(addressBookListDiv)

  addressBookContactCreationDiv.appendChild(addressBookDetailsSection)
  addressBookContactCreationDiv.appendChild(addressBookContactSubmitButton)
  
  addressBookContactCreationDialog.appendChild(closeButton)
  addressBookContactCreationDialog.appendChild(addressBookContactCreationDiv)

  addressBookContactCreationDialog.appendChild(errorDisplaySection)
  addressBookContactCreationDialog.appendChild(statusRegion)
 
  return addressBookContactCreationDialog
}

const createAddressBookDetailsSection = (
  context: DataBrowserContext
): HTMLElement => {
  const addressBookDetailsSection = context.dom.createElement('section')
  addressBookDetailsSection.setAttribute('id', 'addressbook-details-section')
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
    const addressBookDialog = context.dom.getElementById('contacts-addressbook-picker-dialog')
    showPopupOverlay(context)
    addressBookDialog.appendChild(newAddressBookForm)
  }

  const addressBookCreationButton = context.dom.createElement('button')
  addressBookCreationButton.setAttribute('id', 'contacts-create-addressbook-button')
  addressBookCreationButton.setAttribute('type', 'button')
  addressBookCreationButton.setAttribute('role', 'button')
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
    const addressBookContactCreationDialog = context.dom.getElementById('contacts-addressbook-picker-dialog')
    const addressBookUriEntryDiv = createAddressBookUriEntryDiv(context, contactsModule, addressBooksData, contactData)
    showPopupOverlay(context)
    addressBookContactCreationDialog.appendChild(addressBookUriEntryDiv)
  }
  const addressBookCreationButton = context.dom.createElement('button')
  addressBookCreationButton.setAttribute('id', 'contacts-addressbook-uri-entry-button')
  addressBookCreationButton.setAttribute('type', 'button')
  addressBookCreationButton.setAttribute('role', 'button')
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
  addressBookUriEntryDiv.setAttribute('aria-label', 'Address book URI entry div')
  addressBookUriEntryDiv.setAttribute('aria-describedby', 'addressbook-uri-entry-div')
  addressBookUriEntryDiv.setAttribute('id', 'contacts-addressbook-uri-entry')
  addressBookUriEntryDiv.classList.add('contactsPopupDialog', 'contactsAddressBookUriEntry')

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
          const addressBookUriEntry = context.dom.getElementById('contacts-addressbook-uri-entry')
          addressBookUriEntry.remove()
          removePopupOverlayIfNoPopup(context)
          const addressBookCreationButton = context.dom.getElementById('contacts-create-addressbook-button')
          const addressBookUriEntryButton = context.dom.getElementById('contacts-addressbook-uri-entry-button') 
          addressBookCreationButton.remove()
          addressBookUriEntryButton.remove()
          addressBookListDiv.appendChild(createAddressBookButton(context, contactsModule, books.addressBooksData, books.addressBook, enteredAddressBookUri, contactData))
          addressBookListDiv.appendChild(createAddressBookCreationButton(context, contactsModule, books.addressBooksData, contactData))   
          addressBookListDiv.appendChild(createAddressBookUriEntryButton(context, contactsModule, books.addressBooksData, contactData))
          announceContactsStatus(context, 'Address book added to the list.')
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
  addressBookListDiv.setAttribute('aria-label', 'Address book list to select which address book to add the contact to')
  addressBookListDiv.setAttribute('aria-describedby', 'addressbook-list')
  addressBookListDiv.setAttribute('id', 'addressbook-list')

  addressBookListDiv.innerHTML = 'Address Books'
  addressBooksData.public.forEach((addressBook, addressBookUri) => {
    addressBookListDiv.appendChild(createAddressBookButton(context, contactsModule, addressBooksData, addressBook, addressBookUri, contactData))
  })

  addressBooksData.private.forEach((addressBook, addressBookUri) => {
    addressBookListDiv.appendChild(createAddressBookButton(context, contactsModule, addressBooksData, addressBook, addressBookUri, contactData))
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
    const addressBookDialog = context.dom.getElementById('contacts-addressbook-picker-dialog')
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
  groupListDiv.setAttribute('aria-label', 'Group list to select which groups in the address book to add the contact to')
  groupListDiv.setAttribute('aria-describedby', 'group-list')
  groupListDiv.setAttribute('id', 'group-list')

  groupListDiv.innerHTML = 'Groups'
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
  errorDisplaySection.setAttribute('role', 'errorDisplay')
  errorDisplaySection.setAttribute('aria-live', 'assertive')
  errorDisplaySection.setAttribute('tabindex', '0')
  errorDisplaySection.setAttribute('aria-label', 'Section to display error messages related to contact creation')
  errorDisplaySection.setAttribute('id', 'error-display-section')
  errorDisplaySection.classList.add('contactsErrorDisplay')

  const closeButton = context.dom.createElement('button')
  closeButton.setAttribute('type', 'button')
  closeButton.setAttribute('aria-label', 'Close error message display')
  closeButton.setAttribute('tabindex', '0')
  closeButton.setAttribute('role', 'button')
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
    const contactExistsByNameUri = checkIfContactExistsByName(addressBooksData, contactData.name)
    const contactExistsHandled = handleContactExistsFromNonRegisteredAddressBook(
      context,
      addressBooksData,
      contactData,
      contactExistsByWebID,
      contactExistsByNameUri
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
        const contactUri = await createContactInAddressBook(context, contactsModule, contactData, selectedAddressBookUris)
        finalizeContactEntry(context, addressBooksData, contactData, contactUri)
      } catch(error) {
        addErrorToErrorDisplay(context, `${errorContactCreation}\n${error}`)
      }
    } else {
      addErrorToErrorDisplay(context, groupIsRequired)
    }
  }

  const button = context.dom.createElement('button')
  button.setAttribute('type', 'submit')
  button.setAttribute('id', 'add-contact')
  button.setAttribute('role', 'button')
  button.setAttribute('aria-label', 'Add contact to selected address book')
  button.setAttribute('tabindex', '0')
  button.classList.add('contactsActionButton', 'contactsNewContactCreationButton')
  button.addEventListener('click', setButtonOnClickHandler)
  button.textContent = 'Add Contact'
  return button
}

const createAddressBookButton = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  addressBook: AddressBookDetails,
  addressBookUri: string,
  contactData: ContactData
): HTMLButtonElement => {
  
  const setButtonOnClickHandler =  (event) => {
    event.preventDefault()
    const selectedAddressBookButton = event.target
    const previouslySelected = selectedAddressBookButton.classList.contains('contactsSelectedButton') 
    const addressBookDetailsSection = context.dom.getElementById('addressbook-details-section')
    
    let addressBook = null
    // remove the previous groups
    const groupDivToRemove = context.dom.getElementById('group-list')
    if (groupDivToRemove) groupDivToRemove.remove()
    
    // remove presious address book selection bc you can only have one
    const selectedAddressBookElements = context.dom.querySelectorAll('.selectedAddressBook')
    selectedAddressBookElements.forEach((addressBookButton) => {
      addressBookButton.classList.remove('contactsSelectedButton', 'selectedAddressBook')
    })
    
    if (previouslySelected) {
      selectedAddressBookButton.classList.remove('contactsSelectedButton', 'selectedAddressBook') 
      const groupForm = context.dom.getElementById('new-group-form')
      if (groupForm) {
        groupForm.remove()
        removePopupOverlayIfNoPopup(context)
      }
   } else {
      const addressForm = context.dom.getElementById('new-addressbook-form')
      if (addressForm) {
        addressForm.remove()
        removePopupOverlayIfNoPopup(context)
      }

      selectedAddressBookButton.classList.add('contactsSelectedButton', 'selectedAddressBook') 
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

  const button = context.dom.createElement('button')
  button.setAttribute('value', addressBook.name)
  button.setAttribute('id', addressBookUri)
  button.setAttribute('role', 'button') 
  button.setAttribute('type', 'submit')
  button.setAttribute('aria-label', 'Select address book ' + addressBook.name)
  button.setAttribute('tabindex', '0')
  button.classList.add('contactsButton')
  button.addEventListener('click', setButtonOnClickHandler)
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
    let newGroupNode = null

    const addressNameField = context.dom.querySelector('#addressBookNameInput')

    // @ts-ignore
    const enteredAddressName = sanitizeInput(addressNameField.value)
    // @ts-ignore
    addressNameField.value = enteredAddressName

    const addressContainerField = context.dom.querySelector('#addressBookContainerInput')

    // @ts-ignore
    const enteredAddressContainer = sanitizeInput(addressContainerField.value)
    // @ts-ignore
    addressContainerField.value = enteredAddressContainer

    const groupNameField = context.dom.querySelector('#groupNameInput')
    // @ts-ignore
    const enteredGroupName = sanitizeInput(groupNameField.value)
    // @ts-ignore
    groupNameField.value = enteredGroupName

    if (enteredAddressName) {
      // add addressbook first 
      try {
        enteredAddressBookUri = await handleAddressBookCreation(context, enteredAddressContainer, enteredAddressName)
        const books =  await addANewAddressBookUriToAddressBooks(context, contactsModule, addressBooksData, enteredAddressBookUri)
        
        if (enteredGroupName) {
          const selectedAddressBookNode = new NamedNode(enteredAddressBookUri)
          newGroupNode = await saveNewGroup(selectedAddressBookNode, enteredGroupName)
          const groupAdded = await addGroupToAddressBookData(addressBooksData, enteredAddressBookUri, { name: enteredGroupName, uri: newGroupNode.value })
          if (!groupAdded) {
            addErrorToErrorDisplay(context, errorGroupCreation)
            return
          }
        }
   
        const addressBookListDiv = context.dom.querySelector('#addressbook-list')
        const groupListDiv = context.dom.querySelector('#group-list')
          
        if (addressBookListDiv) {
          newAddressBookForm.remove()
          removePopupOverlayIfNoPopup(context)
          const addressBookCreationButton = context.dom.getElementById('contacts-create-addressbook-button')
          const addressBookUriEntryButton = context.dom.getElementById('contacts-addressbook-uri-entry-button') 
          addressBookCreationButton.remove()
          addressBookUriEntryButton.remove()
          addressBookListDiv.appendChild(createAddressBookButton(context, contactsModule, addressBooksData, books.addressBook, enteredAddressBookUri, contactData)) 
          addressBookListDiv.appendChild(addressBookCreationButton)
          addressBookListDiv.appendChild(addressBookUriEntryButton)
          announceContactsStatus(context, 'Address book added to the list.')
        }
        if (groupListDiv) {
          const groupCreationButton = context.dom.getElementById('contacts-create-group-button')
          groupCreationButton.remove()
          groupListDiv.appendChild(createGroupButton(context, {uri: newGroupNode.value, name: enteredGroupName}))
          groupListDiv.appendChild(groupCreationButton)
          announceContactsStatus(context, 'Group added to the list.')
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
  newAddressBookForm.classList.add('contactsPopupDialog', 'contactsNewAddressForm')
  
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

  const groupNameLabel = context.dom.createElement('label')
  groupNameLabel.classList.add('label')
  groupNameLabel.setAttribute('for', 'groupNameInput')

  const groupNameInputBox = context.dom.createElement('input')
  groupNameInputBox.type = 'text'  
  groupNameInputBox.name = 'groupName'  
  groupNameInputBox.id = 'groupNameInput'  
  groupNameInputBox.placeholder = 'New group name'  
  groupNameInputBox.classList.add('input', 'contactsGroupInput')
  groupNameInputBox.required = true

  const validationMessage = createValidationMessage(context)

  attachSanitizingValidation(addressBookNameInputBox, validationMessage)
  attachSanitizingValidation(addressBookContainerInputBox, validationMessage)
  attachSanitizingValidation(groupNameInputBox, validationMessage)

  const submitButton = context.dom.createElement('button')
  submitButton.setAttribute('id', 'submit-addressbook')
  submitButton.setAttribute('role', 'button') 
  submitButton.setAttribute('type', 'submit')
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

  newAddressBookForm.appendChild(groupNameLabel)
  newAddressBookForm.appendChild(groupNameInputBox)
  newAddressBookForm.appendChild(validationMessage)
  newAddressBookForm.appendChild(submitButton)
  newAddressBookForm.addEventListener('submit', newAddressBookEventListener)
    
  return newAddressBookForm
}

const createCloseButton = (
  context: DataBrowserContext,
  element: HTMLElement,
  specialClass: string
): HTMLButtonElement => {

  const buttonID = `${element.id}-close-button`
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
  closeButton.setAttribute('id', buttonID)
  closeButton.setAttribute('role', 'button')
  closeButton.setAttribute('type', 'button')
  const ariaLabel = specialClass === 'contactsCloseButton'
    ? 'Close contacts dialog'
    : 'Close dialog'
  closeButton.setAttribute('aria-label', ariaLabel)
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

  const addGroupEventListener = async (event) => {
    event.preventDefault()
    let selectedAddressBookUri = null 

    const selectedAddressBookElement = context.dom.querySelectorAll('.selectedAddressBook')
    selectedAddressBookElement.forEach((addressBookButton) => {
      selectedAddressBookUri = addressBookButton.getAttribute('id')
    })
    
    const groupNameField = context.dom.querySelector('#groupNameInput')
    // @ts-ignore
    const enteredGroupName = sanitizeInput(groupNameField.value)
    // @ts-ignore
    groupNameField.value = enteredGroupName

    if (!selectedAddressBookUri) {
      addErrorToErrorDisplay(context, errorNotExistsAddressBookUri)
      return
    }

    if (enteredGroupName) {
      // add group first 
      try {
        const selectedAddressBookNode = new NamedNode(selectedAddressBookUri)
        const newGroupNode = await saveNewGroup(selectedAddressBookNode, enteredGroupName)
        const newGroup = { name: enteredGroupName, uri: newGroupNode.value }
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
          announceContactsStatus(context, 'Group added to the list.')
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
  newGroupForm.classList.add('contactsPopupDialog', 'contactsNewGroupForm')
  
  const groupNameLabel = context.dom.createElement('label')
  groupNameLabel.classList.add('label')
  groupNameLabel.setAttribute('for', 'groupNameInput')

  const groupNameInputBox = context.dom.createElement('input')
  groupNameInputBox.type = 'text' 
  groupNameInputBox.name = 'groupName' 
  groupNameInputBox.id = 'groupNameInput' 
  groupNameInputBox.placeholder = 'New group name' 
  groupNameInputBox.classList.add('input', 'contactsGroupInput')

  const validationMessage = createValidationMessage(context)

  attachSanitizingValidation(groupNameInputBox, validationMessage)
 
  const submitButton = createAddGroupButton(context, newGroupForm)
  const closeButton = createCloseButton(context, newGroupForm, 'contactsGroupCreationCloseButton')

  newGroupForm.appendChild(groupNameLabel)
  newGroupForm.appendChild(groupNameInputBox)
  newGroupForm.appendChild(validationMessage)
  newGroupForm.appendChild(submitButton)
  newGroupForm.appendChild(closeButton)
    
  return newGroupForm
}

const createAddGroupButton = (
  context: DataBrowserContext,
  form: HTMLFormElement
): HTMLButtonElement => {
  const setButtonOnClickHandler = async (event) => {
    event.preventDefault()
    form.requestSubmit()
  }

  const button = context.dom.createElement('button')
  button.setAttribute('id', 'contacts-create-group-button')
  button.setAttribute('type', 'button')
  button.setAttribute('role', 'button')
  button.setAttribute('aria-label', 'Create a new group in the selected address book')
  button.setAttribute('tabindex', '0')
  button.textContent = 'Create Group'
  button.classList.add('contactsActionButton', 'contactsCreateGroupCreationButton')
  button.addEventListener('click', setButtonOnClickHandler)
  return button
}     

const handleContactExistsFromNonRegisteredAddressBook = (
  context: DataBrowserContext,
  addressBooksData: AddressBooksData,
  contactData: ContactData,
  contactExistsByWebID: boolean,
  contactExistsByNameUri: string,
): Boolean => {
  

  if (contactExistsByWebID) {
      addErrorToErrorDisplay(context, contactExistsMessage )
      return true
    } else if (contactExistsByNameUri) {
      const fromRegisteredAddressBook = false
      const handled = handleContactExistsByName(context, addressBooksData, contactData, contactExistsByNameUri, fromRegisteredAddressBook)
      return handled
    }
    return false
}

export const handleContactExistsByName = (
  context: DataBrowserContext,
  addressBooksData: AddressBooksData,
  contactData: ContactData,
  contactExistsByNameUri: string,
  fromRegisteredAddressBook: boolean
): Boolean => {
  const selectorDialog = context.dom.getElementById('contacts-addressbook-picker-dialog')
  const buttonContainer = getButtonContainer(context)
  
  const contactExistsDiv = context.dom.createElement('div')
  contactExistsDiv.setAttribute('role', 'alert')
  contactExistsDiv.setAttribute('aria-live', 'assertive')
  contactExistsDiv.setAttribute('tabindex', '0')
  contactExistsDiv.setAttribute('aria-label', 'Alert message indicating that the contact already exists')
  contactExistsDiv.setAttribute('id', 'contacts-contact-exists')
  contactExistsDiv.classList.add('contactsContactExistsAlert')
  contactExistsDiv.innerHTML = `${contactData.name} already exists. \n Do you want to add their WebID?`
  
  const confirmButton = context.dom.createElement('button')
  confirmButton.setAttribute('id', 'contacts-confirm-add-webid-button')
  confirmButton.setAttribute('role', 'button')
  confirmButton.setAttribute('type', 'button')
  confirmButton.setAttribute('aria-label', 'Confirm adding the contact webID to the existing contact')
  confirmButton.setAttribute('tabindex', '0') 
  confirmButton.classList.add('contactsConfirmButton')
  confirmButton.innerHTML = 'Yes'
  confirmButton.addEventListener('click', async (event) => {
    event.preventDefault()
    await addWebIDToExistingContact(context, contactData, contactExistsByNameUri)
    contactExistsDiv.remove()
    finalizeContactEntry(context, addressBooksData, contactData, addressBooksData.contactWebIDs.get(contactData.webID))
    refreshButton(context, addressBooksData, contactData)  
  })

  const cancelButton = context.dom.createElement('button')
  cancelButton.setAttribute('id', 'contacts-cancel-add-webid-button')
  cancelButton.setAttribute('role', 'button')
  cancelButton.setAttribute('type', 'button')
  cancelButton.setAttribute('aria-label', 'Cancel adding the contact webID to the existing contact')
  cancelButton.setAttribute('tabindex', '0')
  cancelButton.classList.add('contactsCancelButton')
  cancelButton.innerHTML = 'No'
  cancelButton.addEventListener('click', (event) => {
    event.preventDefault()
    if (!fromRegisteredAddressBook) selectorDialog.remove()
    
    contactExistsDiv.remove()
    complain(getButtonContainer(context), context, 'Contact was not added')
    setTimeout(() => {
      clearPreviousMessage(getButtonContainer(context))
    }, 2000)  
      refreshButton(context, addressBooksData, contactData)  
  })

  const actionsDiv = context.dom.createElement('div')
  actionsDiv.setAttribute('id', 'contacts-contact-exists-actions')
  actionsDiv.setAttribute('role', 'group')
  actionsDiv.setAttribute('aria-label', 'Actions for existing contact alert') 
  actionsDiv.setAttribute('tabindex', '0')
  actionsDiv.classList.add('contactsContactExistsActions')
  actionsDiv.appendChild(confirmButton)
  actionsDiv.appendChild(cancelButton)

  contactExistsDiv.appendChild(actionsDiv)
  showPopupOverlay(context)
  if (fromRegisteredAddressBook) {
    buttonContainer.appendChild(contactExistsDiv)
  } else {
    selectorDialog.appendChild(contactExistsDiv)
  }
  return true
}

const finalizeContactEntry = (
  context: DataBrowserContext,
  addressBooksData: AddressBooksData,
  contactData: ContactData,
  contactUri: string,
) => {
    addressBooksData.contactWebIDs.set(contactData.webID, contactUri)
    const selectorDialog = context.dom.getElementById('contacts-addressbook-picker-dialog')
    if (selectorDialog) selectorDialog.remove()
    
    const buttonContainer = getButtonContainer(context)
    mention(buttonContainer, contactWasAddedSuccesMessage)
    setTimeout(() => {
      clearPreviousMessage(buttonContainer)
    }, 2000)  
    refreshButton(context, addressBooksData, contactData)  
}

const createGroupButton = (
  context: DataBrowserContext,
  group: GroupData
): HTMLButtonElement => {
  const setButtonOnClickHandler = async (event) => {
    event.preventDefault()
    
    const selectedGroupButton = event.target
    const previouslySelected = selectedGroupButton.classList.contains('contactsSelectedButton') 
    
    if (previouslySelected) {
      selectedGroupButton.classList.remove('contactsSelectedButton', 'selectedGroup')
      checkAndAddErrorDisplay(context, groupIsRequired)
    } else {
      selectedGroupButton.classList.add('contactsSelectedButton', 'selectedGroup') 
      checkAndRemoveErrorDisplay(context)
    }
  } 

  const button = context.dom.createElement('button')
  button.setAttribute('value', group.name)
  button.setAttribute('id', group.uri)
  button.setAttribute('type', 'button')
  button.setAttribute('role', 'button')
  button.setAttribute('aria-label', 'Select group ' + group.name)
  button.setAttribute('tabindex', '0')
  button.classList.add('contactsButton')
  button.addEventListener('click', setButtonOnClickHandler)
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
  const selectorDialog = context.dom.getElementById('contacts-addressbook-picker-dialog')
  if (!selectorDialog) return

  selectorDialog.classList.add(CONTACTS_OVERLAY_ACTIVE_CLASS)

  const existingOverlay = selectorDialog.querySelector(`#${CONTACTS_POPUP_OVERLAY_ID}`)
  if (existingOverlay) return

  const overlay = context.dom.createElement('div')
  overlay.setAttribute('role', 'popupOverlay')
  overlay.setAttribute('aria-label', 'Overlay to focus on the active popup message and disable interaction with the rest of the dialog')  
  overlay.setAttribute('tabindex', '0')
  overlay.setAttribute('id', CONTACTS_POPUP_OVERLAY_ID)
  overlay.classList.add('contactsPopupOverlay')
  selectorDialog.appendChild(overlay)
}

const removePopupOverlayIfNoPopup = (
  context: DataBrowserContext
): void => {
  const selectorDialog = context.dom.getElementById('contacts-addressbook-picker-dialog')
  if (!selectorDialog) return

  const activePopup = selectorDialog.querySelector('.contactsPopupDialog, .contactsContactExistsAlert')
  if (activePopup) return

  const overlay = selectorDialog.querySelector(`#${CONTACTS_POPUP_OVERLAY_ID}`)
  if (overlay) overlay.remove()
  selectorDialog.classList.remove(CONTACTS_OVERLAY_ACTIVE_CLASS)
}
/* Sanitization and validation */
function sanitizeInput(input: string): string {
  return (input || '')
    .replace(/[^a-zA-Z0-9 ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function attachSanitizingValidation(input: HTMLInputElement, feedbackElement: HTMLElement): void {
  input.addEventListener('input', () => {
    const rawValue = input.value
    const sanitizedValue = sanitizeInput(rawValue)

    if (rawValue !== sanitizedValue) {
      input.value = sanitizedValue
      input.setAttribute('aria-invalid', 'true')
      feedbackElement.textContent = 'Only letters, numbers, and spaces are allowed.'
      feedbackElement.classList.add('contactsInputValidationMessage--visible')
      feedbackElement.setAttribute('aria-hidden', 'false')
      return
    }

    input.removeAttribute('aria-invalid')
    feedbackElement.textContent = ''
    feedbackElement.classList.remove('contactsInputValidationMessage--visible')
    feedbackElement.setAttribute('aria-hidden', 'true')
  })
}

function createValidationMessage(context: DataBrowserContext): HTMLParagraphElement {
  const validationMessage = context.dom.createElement('p')
  validationMessage.setAttribute('role', 'status')
  validationMessage.setAttribute('aria-live', 'polite')
  validationMessage.classList.add('contactsInputValidationMessage')
  validationMessage.setAttribute('aria-hidden', 'true')
  return validationMessage
}

function createContactsStatusRegion(context: DataBrowserContext): HTMLParagraphElement {
  const statusRegion = context.dom.createElement('p')
  statusRegion.setAttribute('id', 'contacts-list-status')
  statusRegion.setAttribute('role', 'status')
  statusRegion.setAttribute('aria-live', 'polite')
  statusRegion.classList.add('sr-only')
  return statusRegion
}

function announceContactsStatus(context: DataBrowserContext, message: string): void {
  const statusRegion = context.dom.getElementById('contacts-list-status')
  if (!statusRegion) return

  statusRegion.textContent = ''
  setTimeout(() => {
    statusRegion.textContent = message
  }, 0)
}
