import { DataBrowserContext } from 'pane-registry'
import { addAddressBookToAddressBooksData, addGroupToAddressBookData, refreshButton } from './helpers'
import { checkIfContactExistsByName, checkIfContactExistsByWebID } from './selectors'
import { addANewAddressBookUriToAddressBooks, addWebIDToExistingContact, createContactInAddressBook, handleAddressBookCreation } from './mutations'
import { AddressBookDetails, AddressBooksData, ContactData, GroupData } from './contactsTypes'
import ContactsModuleRdfLib from '@solid-data-modules/contacts-rdflib'
import { render } from 'lit-html'
import { clearPreviousMessage, complain, mention } from '../../buttonsHelper'
import { contactExistsMessage, contactWasAddedSuccesMessage, dialogCancelLabelText, errorContactCreation, errorGroupCreation, errorNotExistsAddressBookUri, groupIsRequired } from '../../texts'
import { createErrorDisplaySection, addErrorToErrorDisplay, checkAndAddErrorToDisplay, checkAndRemoveErrorDisplay } from './contactsErrors'
import { literal, NamedNode, st, sym } from 'rdflib'
import { closeIcon } from '../../icons-svg/profileIcons'
import { ns } from 'solid-ui'
import { setSharedDialogSavingState } from '../../ui/dialog'

const CONTACTS_POPUP_OVERLAY_ID = 'contacts-popup-overlay'
const CONTACTS_OVERLAY_ACTIVE_CLASS = 'contacts-dialog--overlay-active'

export const createAddressBookContactCreationDialog = (context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData,
  addressBooksData: AddressBooksData
): HTMLFormElement => {
  const addressBookContactCreationDialog = context.dom.createElement('form')
  addressBookContactCreationDialog.classList.add('contacts-dialog__frame', 'contacts-dialog__content')
  addressBookContactCreationDialog.setAttribute('id', 'contacts-addressbook-picker-dialog')

  const dialogDescription = context.dom.createElement('p')
  dialogDescription.classList.add('contacts-dialog__description')
  dialogDescription.textContent = 'Choose an address book and group for this contact, or create them first.'

  const addressBookContactCreationDiv = context.dom.createElement('section')
  addressBookContactCreationDiv.setAttribute('aria-label', 'Contact creation options')
  addressBookContactCreationDiv.classList.add('contacts-dialog__body', 'contacts-dialog__creation')

  const cancelButton = createDialogCancelButton(context, addressBookContactCreationDialog)
  const addressBookContactSubmitButton = createNewContactCreationButton(context, contactsModule, addressBooksData, contactData)
  const footer = context.dom.createElement('div')
  footer.classList.add('contacts-dialog__footer')

  const addressBookDetailsSection = createAddressBookDetailsSection(context)
  const errorDisplaySection = createErrorDisplaySection(context)
  const statusRegion = createContactsStatusRegion(context)
  const addressBookListDiv = createAddressBookListSection(context, contactsModule, contactData, addressBooksData)
  const inlinePanelRegion = createInlinePanelRegion(context)
  addressBookDetailsSection.appendChild(addressBookListDiv)
  addressBookDetailsSection.appendChild(inlinePanelRegion)

  addressBookContactCreationDiv.appendChild(addressBookDetailsSection)
  footer.appendChild(cancelButton)
  footer.appendChild(addressBookContactSubmitButton)

  addressBookContactCreationDialog.appendChild(dialogDescription)
  addressBookContactCreationDialog.appendChild(addressBookContactCreationDiv)
  addressBookContactCreationDialog.appendChild(errorDisplaySection)
  addressBookContactCreationDialog.appendChild(footer)
  addressBookContactCreationDialog.appendChild(statusRegion)

  setTimeout(() => {
    const firstAction = addressBookContactCreationDialog.querySelector('#addressbook-list button, #contacts-create-addressbook-button, #contacts-addressbook-uri-entry-button') as HTMLElement | null
    if (firstAction) firstAction.focus()
  }, 0)
 
  return addressBookContactCreationDialog
}

// Backward-compatible export name used by consumers and tests.
export const createAddressBookUriSelectorDialog = createAddressBookContactCreationDialog

function createPopupHeader(
  context: DataBrowserContext,
  title: string,
  titleId: string,
  closeButton: HTMLButtonElement
): HTMLDivElement {
  const header = context.dom.createElement('div')
  header.classList.add('contacts-dialog__header', 'contacts-dialog__header--popup')

  const heading = context.dom.createElement('h3')
  heading.setAttribute('id', titleId)
  heading.classList.add('contacts-dialog__title', 'contacts-dialog__title--popup')
  heading.textContent = title

  header.appendChild(heading)
  header.appendChild(closeButton)
  return header
}

const createAddressBookDetailsSection = (
  context: DataBrowserContext
): HTMLElement => {
  const addressBookDetailsSection = context.dom.createElement('section')
  addressBookDetailsSection.setAttribute('id', 'addressbook-details-section')
  addressBookDetailsSection.classList.add('contacts-dialog__details')

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
    resetSelectedAddressBookState(context)
    const newAddressBookForm = createNewAddressBookForm(context, addressBooksData, contactsModule, contactData)
    renderInlinePanel(context, newAddressBookForm)
  }

  const addressBookCreationButton = context.dom.createElement('button')
  addressBookCreationButton.setAttribute('id', 'contacts-create-addressbook-button')
  addressBookCreationButton.setAttribute('type', 'button')
  addressBookCreationButton.textContent = 'Create Address Book'
  addressBookCreationButton.classList.add('contacts-dialog__action-button', 'contacts-dialog__action-button--primary')
  addressBookCreationButton.addEventListener('click', setButtonOnClickHandler)
  return addressBookCreationButton
}

const createAddressBookUriEntryDialog = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  contactData: ContactData
): HTMLElement => {
  const addressBookUriEntryDialog = context.dom.createElement('section')
  addressBookUriEntryDialog.setAttribute('aria-labelledby', 'contacts-addressbook-uri-entry-title')
  addressBookUriEntryDialog.setAttribute('id', 'contacts-addressbook-uri-entry')
  addressBookUriEntryDialog.classList.add('contacts-dialog__popup', 'contacts-dialog__uri-entry')

  const closeButton = createCloseButton(context, addressBookUriEntryDialog, 'contacts-dialog__close--uri-entry')
  addressBookUriEntryDialog.appendChild(createPopupHeader(context, 'Enter address book URI', 'contacts-addressbook-uri-entry-title', closeButton))
  addressBookUriEntryDialog.appendChild(createAddressBookUriEntryForm(context, contactsModule, addressBooksData, contactData))
  return addressBookUriEntryDialog
}
const createAddressBookUriEntryButton = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  contactData: ContactData
): HTMLButtonElement => {
  const setButtonOnClickHandler = async (event) => { 
    event.preventDefault()
    resetSelectedAddressBookState(context)
    const addressBookUriEntryDialog = createAddressBookUriEntryDialog(context, contactsModule, addressBooksData, contactData)
    renderInlinePanel(context, addressBookUriEntryDialog)
  }

  const addressBookCreationButton = context.dom.createElement('button')
  addressBookCreationButton.setAttribute('id', 'contacts-addressbook-uri-entry-button')
  addressBookCreationButton.setAttribute('type', 'button')
  addressBookCreationButton.textContent = 'Enter Address Book URI'
  addressBookCreationButton.classList.add('contacts-dialog__action-button', 'contacts-dialog__action-button--primary')
  addressBookCreationButton.addEventListener('click', setButtonOnClickHandler)
  return addressBookCreationButton
}

const createAddressBookUriEntryForm = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  contactData: ContactData
): HTMLFormElement => {
  let submitButton: HTMLButtonElement | null = null

  const setButtonOnSubmitHandler = async (event) => {
    event.preventDefault()
    await runWithButtonLoading(context, submitButton, 'Adding...', async () => {
      const addressBookUriField = context.dom.querySelector('#addressBookUriInput') as HTMLInputElement | null

      const enteredAddressBookUri = sanitizeInput(addressBookUriField?.value || '')
      if (addressBookUriField) addressBookUriField.value = enteredAddressBookUri

      if (!enteredAddressBookUri) {
        addErrorToErrorDisplay(context, errorNotExistsAddressBookUri)
        return
      }

      const uriCheck = enteredAddressBookUri.substring(enteredAddressBookUri.length - 5, enteredAddressBookUri.length)
      const normalizedUri = (uriCheck === '#this') ? enteredAddressBookUri : enteredAddressBookUri + '#this'
      const books = await addANewAddressBookUriToAddressBooks(context, contactsModule, addressBooksData, normalizedUri)

      const addressBookListDiv = context.dom.querySelector('#addressbook-list')
      if (addressBookListDiv) {
        clearInlinePanel(context)
        removePopupOverlayIfNoPopup(context)
        const addressBookCreationButton = context.dom.getElementById('contacts-create-addressbook-button')
        const addressBookUriEntryButton = context.dom.getElementById('contacts-addressbook-uri-entry-button')
        addressBookCreationButton.remove()
        addressBookUriEntryButton.remove()
        addressBookListDiv.appendChild(createAddressBookButton(context, contactsModule, books.addressBooksData, books.addressBook, enteredAddressBookUri, contactData))
        addressBookListDiv.appendChild(createAddressBookCreationButton(context, contactsModule, books.addressBooksData, contactData))
        addressBookListDiv.appendChild(createAddressBookUriEntryButton(context, contactsModule, books.addressBooksData, contactData))
        announceContactsStatus(context, 'Address book added to the list.')
      }
    })
  }

  const inputAddressUriEventListener = (event) => {
    const input = event.target as HTMLInputElement
    input.value = sanitizeInput(input.value)
    checkAndRemoveErrorDisplay(context)
  }
  const addressBookUriEntryForm = context.dom.createElement('form')
  addressBookUriEntryForm.setAttribute('id', 'contacts-address-uri-entry-form')
  addressBookUriEntryForm.classList.add('contacts-dialog__uri-entry-form')
  addressBookUriEntryForm.method = 'post'
  addressBookUriEntryForm.addEventListener('submit', setButtonOnSubmitHandler)
  const popupBody = createPopupSection(context, 'contacts-dialog__popup-body')
  const popupFooter = createPopupSection(context, 'contacts-dialog__popup-footer')

  const addressBookUriEntryLabel = context.dom.createElement('label')
  addressBookUriEntryLabel.setAttribute('for', 'addressBookUriInput')
  const addressBookUriEntryLabelText = context.dom.createElement('span')
  addressBookUriEntryLabelText.classList.add('sr-only')
  addressBookUriEntryLabelText.textContent = 'Address book URI'
  addressBookUriEntryLabel.appendChild(addressBookUriEntryLabelText)

  const addressBookNameInputBox = context.dom.createElement('input')
  addressBookNameInputBox.type = 'text'
  addressBookNameInputBox.name = 'addressBookUri'
  addressBookNameInputBox.id = 'addressBookUriInput'
  addressBookNameInputBox.placeholder = 'Enter address book URI to find your address book'
  addressBookNameInputBox.classList.add('input', 'contacts-dialog__uri-input')
  addressBookNameInputBox.addEventListener('input', inputAddressUriEventListener)
  
  popupBody.appendChild(addressBookUriEntryLabel)
  popupBody.appendChild(addressBookNameInputBox)
  submitButton = createAddressBookUriEntryAddButton(context)
  popupFooter.appendChild(submitButton)
  addressBookUriEntryForm.appendChild(popupBody)
  addressBookUriEntryForm.appendChild(popupFooter)
  
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
  entryButton.setAttribute('aria-label', 'Submit new address book URI')
  entryButton.setAttribute('id', 'contacts-addressbook-entry-button')
  entryButton.classList.add('contacts-dialog__action-button', 'contacts-dialog__action-button--primary', 'contacts-dialog__uri-submit')
  entryButton.setAttribute('type', 'submit')
  entryButton.addEventListener('click', setButtonOnClickHandler)
  entryButton.textContent = 'Add'
  return entryButton
}

const createAddressBookListSection = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData,
  addressBooksData: AddressBooksData
): HTMLElement => {

  const addressBookListSection = context.dom.createElement('section')
  addressBookListSection.setAttribute('class', 'contacts-dialog__address-book-list')
  addressBookListSection.setAttribute('aria-label', 'Select an address book for this contact.')
  addressBookListSection.setAttribute('aria-describedby', 'addressbook-list')
  addressBookListSection.setAttribute('id', 'addressbook-list')
  const heading = context.dom.createElement('h3')
  heading.classList.add('contacts-dialog__column-title')
  heading.textContent = 'Address books'
  addressBookListSection.appendChild(heading)
  addressBooksData.public.forEach((addressBook, addressBookUri) => {
    addressBookListSection.appendChild(createAddressBookButton(context, contactsModule, addressBooksData, addressBook, addressBookUri, contactData))
  })

  addressBooksData.private.forEach((addressBook, addressBookUri) => {
    addressBookListSection.appendChild(createAddressBookButton(context, contactsModule, addressBooksData, addressBook, addressBookUri, contactData))
  })
  const addressBookCreationButton = createAddressBookCreationButton(context, contactsModule, addressBooksData, contactData)
  const addressBookUriEntryButton = createAddressBookUriEntryButton(context, contactsModule, addressBooksData, contactData)

  addressBookListSection.appendChild(addressBookCreationButton)
  addressBookListSection.appendChild(addressBookUriEntryButton)
  return addressBookListSection
}

const createAddressBookGroupCreationButton = (
  context: DataBrowserContext, 
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  contactData: ContactData
): HTMLButtonElement => {
  const setButtonOnClickHandler = async (event) => { 
    event.preventDefault()
    const groupNameForm = context.dom.getElementById('new-group-form')
    if (!groupNameForm) {
      const newGroupForm = createGroupNameForm(context, contactsModule, addressBooksData, contactData)
      renderInlinePanel(context, newGroupForm)
    }
  }
  const groupCreationButton = context.dom.createElement('button')
  groupCreationButton.setAttribute('id', 'contacts-create-group-button')
  groupCreationButton.setAttribute('type', 'button')
  groupCreationButton.textContent = 'Create Group'
  groupCreationButton.classList.add('contacts-dialog__action-button', 'contacts-dialog__action-button--primary')
  groupCreationButton.addEventListener('click', setButtonOnClickHandler)
  return groupCreationButton
}

const createGroupListSection = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  addressBook: AddressBookDetails,
  contactData: ContactData
): HTMLElement => {

  const groupListSection = context.dom.createElement('section')
  groupListSection.setAttribute('class', 'contacts-dialog__group-list')
  groupListSection.setAttribute('aria-label', 'Select a group to add your contact to.')
  groupListSection.setAttribute('aria-describedby', 'group-list')
  groupListSection.setAttribute('id', 'group-list')
  const heading = context.dom.createElement('h3')
  heading.classList.add('contacts-dialog__column-title')
  heading.textContent = 'Groups'
  groupListSection.appendChild(heading)
  if (addressBook) {
    addressBook.groups.map((group) => {
        groupListSection.appendChild(createGroupButton(context, group))
    })
  } 
  groupListSection.appendChild(createAddressBookGroupCreationButton(context, contactsModule, addressBooksData, contactData))
  return groupListSection as HTMLElement
}

const createNewContactCreationButton = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData,
  contactData: ContactData
): HTMLButtonElement => {
  let button: HTMLButtonElement

  const setButtonOnClickHandler = async (event) => {
    event.preventDefault()

    await runWithButtonLoading(context, button, 'Adding...', async () => {
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
      const selectedGroupUris = []

      const selectedAddressBookElements = context.dom.querySelectorAll('#addressbook-list .contacts-dialog__list-button--selected')
      selectedAddressBookElements.forEach((addressBookButton) => {
        selectedAddressBookUri = addressBookButton.getAttribute('id')
      })

      const selectedGroupElements = context.dom.querySelectorAll('#group-list .contacts-dialog__list-button--selected')
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
    })
  }

  button = context.dom.createElement('button')
  button.setAttribute('id', 'contacts-submit-contact-button')
  button.setAttribute('type', 'submit')
  button.classList.add('contacts-dialog__action-button', 'contacts-dialog__action-button--primary', 'contacts-dialog__submit-contact')
  button.disabled = true
  button.setAttribute('aria-disabled', 'true')
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
    const selectedAddressBookButton = event.target as HTMLButtonElement
    const previouslySelected = selectedAddressBookButton.classList.contains('contacts-dialog__list-button--selected') 
    const addressBookDetailsSection = context.dom.getElementById('addressbook-details-section')
    
    let addressBook = null
    // remove the previous groups
    const groupDivToRemove = context.dom.getElementById('group-list')
    if (groupDivToRemove) groupDivToRemove.remove()
    
    // remove presious address book selection bc you can only have one
    const selectedAddressBookElements = context.dom.querySelectorAll('#addressbook-list .contacts-dialog__list-button--selected')
    selectedAddressBookElements.forEach((addressBookButton) => {
      addressBookButton.classList.remove('contacts-dialog__list-button--selected')
    })
    
    if (previouslySelected) {
      selectedAddressBookButton.classList.remove('contacts-dialog__list-button--selected') 
      clearInlinePanel(context)
   } else {
      clearInlinePanel(context)

      selectedAddressBookButton.classList.add('contacts-dialog__list-button--selected') 
      // selected address book code
      const selectedAddressBookUri = selectedAddressBookButton.id
      // can check for the class on private
      addressBook = addressBooksData.public.get(selectedAddressBookUri) 
      if (!addressBook) addressBook = addressBooksData.private.get(selectedAddressBookUri) 
      
      // remove the previous groups
      const groupDivToRemove = context.dom.getElementById('group-list')
      if (groupDivToRemove) groupDivToRemove.remove()
      // add groups for addressbook    
      const groupListSection = createGroupListSection(context, contactsModule, addressBooksData, addressBook, contactData)  
      addressBookDetailsSection.appendChild(groupListSection)
    }

    selectedAddressBookButton.blur()
    syncAddContactActionState(context)
  }

  const button = context.dom.createElement('button')
  button.setAttribute('value', addressBook.name)
  button.setAttribute('id', addressBookUri)
  button.setAttribute('type', 'button')
  button.setAttribute('aria-label', 'Select address book ' + addressBook.name)
  button.classList.add('contacts-dialog__list-button')
  button.addEventListener('click', setButtonOnClickHandler)
  button.textContent = addressBook.name
  return button
}

const createNewAddressBookForm = (
  context: DataBrowserContext,
  addressBooksData: AddressBooksData,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData
): HTMLFormElement => {
  let submitButton: HTMLButtonElement | null = null

  const newAddressBookEventListener = async (event) => {
    event.preventDefault()
    await runWithButtonLoading(context, submitButton, 'Creating...', async () => {
      let enteredAddressBookUri = null
      let newGroupNode: NamedNode | null = null

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

      if (!enteredAddressName) return

      try {
        enteredAddressBookUri = await handleAddressBookCreation(context, enteredAddressContainer, enteredAddressName)
        if (!enteredAddressBookUri) {
          throw new Error(errorNotExistsAddressBookUri)
        }

        const resolvedAddressBookUri = enteredAddressBookUri
        
        if (enteredGroupName) {
          const selectedAddressBookNode = new NamedNode(resolvedAddressBookUri)
          newGroupNode = await saveNewGroupToAddressBook(context, selectedAddressBookNode, enteredGroupName)
        }

        const nextAddressBooksData = addAddressBookToAddressBooksData(
          addressBooksData,
          resolvedAddressBookUri,
          {
            name: enteredAddressName,
            groups: newGroupNode ? [{ name: enteredGroupName, uri: newGroupNode.value }] : [],
            contacts: []
          },
          'private'
        )

        refreshAddressBookDialogContents(
          context,
          contactsModule,
          contactData,
          nextAddressBooksData,
          resolvedAddressBookUri,
          newGroupNode?.value || null
        )

        clearInlinePanel(context)
        removePopupOverlayIfNoPopup(context)
      } catch (error) {
        addErrorToErrorDisplay(context, error)
      }
    })
  }   

  const submitFormEventListener = (event) => {
    event.preventDefault()
    newAddressBookForm.requestSubmit()
  }

  const newAddressBookForm = context.dom.createElement('form')
  newAddressBookForm.setAttribute('aria-labelledby', 'new-addressbook-form-title')
  newAddressBookForm.method = 'post'
  newAddressBookForm.setAttribute('id', 'new-addressbook-form')
  newAddressBookForm.classList.add('contacts-dialog__popup', 'contacts-dialog__address-form')
  
  const addressBookNameLabel = context.dom.createElement('label')
  addressBookNameLabel.setAttribute('for', 'addressBookNameInput')
  const addressBookNameLabelText = context.dom.createElement('span')
  addressBookNameLabelText.classList.add('sr-only')
  addressBookNameLabelText.textContent = 'Address book name'
  addressBookNameLabel.appendChild(addressBookNameLabelText)

  const addressBookNameInputBox = context.dom.createElement('input')
  addressBookNameInputBox.type = 'text'
  addressBookNameInputBox.name = 'addressBookName'
  addressBookNameInputBox.id = 'addressBookNameInput' 
  addressBookNameInputBox.placeholder = 'New address book name' 
  addressBookNameInputBox.classList.add('input', 'contacts-dialog__address-input')
  addressBookNameInputBox.required = true

  const addressBookContainerLabel = context.dom.createElement('label')
  addressBookContainerLabel.setAttribute('for', 'addressBookContainerInput')
  const addressBookContainerLabelText = context.dom.createElement('span')
  addressBookContainerLabelText.classList.add('sr-only')
  addressBookContainerLabelText.textContent = 'Address book container'
  addressBookContainerLabel.appendChild(addressBookContainerLabelText)

  const addressBookContainerInputBox = context.dom.createElement('input')
  addressBookContainerInputBox.type = 'text'
  addressBookContainerInputBox.name = 'addressBookContainer'
  addressBookContainerInputBox.id = 'addressBookContainerInput' 
  addressBookContainerInputBox.placeholder = 'Address book container' 
  addressBookContainerInputBox.classList.add('input', 'contacts-dialog__address-input')
  addressBookContainerInputBox.required = true

  const groupNameLabel = context.dom.createElement('label')
  groupNameLabel.setAttribute('for', 'groupNameInput')
  const groupNameLabelText = context.dom.createElement('span')
  groupNameLabelText.classList.add('sr-only')
  groupNameLabelText.textContent = 'Group name'
  groupNameLabel.appendChild(groupNameLabelText)

  const groupNameInputBox = context.dom.createElement('input')
  groupNameInputBox.type = 'text'  
  groupNameInputBox.name = 'groupName'  
  groupNameInputBox.id = 'groupNameInput'  
  groupNameInputBox.placeholder = 'New group name'  
  groupNameInputBox.classList.add('input', 'contacts-dialog__group-input')
  groupNameInputBox.required = true

  const validationMessage = createValidationMessage(context)

  attachSanitizingValidation(addressBookNameInputBox, validationMessage)
  attachSanitizingValidation(addressBookContainerInputBox, validationMessage)
  attachSanitizingValidation(groupNameInputBox, validationMessage)

  submitButton = context.dom.createElement('button')
  submitButton.setAttribute('type', 'submit')
  submitButton.classList.add('contacts-dialog__action-button', 'contacts-dialog__action-button--primary', 'contacts-dialog__address-submit')
  submitButton.addEventListener('click', submitFormEventListener)
  submitButton.innerHTML = 'Create Address Book' 
  
  const closeButton = createCloseButton(context, newAddressBookForm, 'contacts-dialog__close--address-create')
  const popupBody = createPopupSection(context, 'contacts-dialog__popup-body')
  const popupFooter = createPopupSection(context, 'contacts-dialog__popup-footer')

  newAddressBookForm.appendChild(createPopupHeader(context, 'Create a new address book', 'new-addressbook-form-title', closeButton))

  popupBody.appendChild(addressBookNameLabel)
  popupBody.appendChild(addressBookNameInputBox)

  popupBody.appendChild(addressBookContainerLabel)
  popupBody.appendChild(addressBookContainerInputBox)

  popupBody.appendChild(groupNameLabel)
  popupBody.appendChild(groupNameInputBox)
  popupBody.appendChild(validationMessage)
  popupFooter.appendChild(submitButton)
  newAddressBookForm.appendChild(popupBody)
  newAddressBookForm.appendChild(popupFooter)
  newAddressBookForm.addEventListener('submit', newAddressBookEventListener)
    
  return newAddressBookForm
}

function removeDialogElement(
  context: DataBrowserContext,
  element: HTMLElement
): void {
  if (element && element.classList.contains('contacts-dialog__inline-panel')) {
    clearInlinePanel(context)
  } else if (element) {
    element.remove()
    removePopupOverlayIfNoPopup(context)
  }
}

const createCloseButton = (
  context: DataBrowserContext,
  element: HTMLElement,
  specialClass: string
): HTMLButtonElement => {

  const buttonID = `${element.id}-close-button`
  const setButtonOnClickHandler = (event) => {
    event.preventDefault()
    removeDialogElement(context, element)
  }

  const closeButton = context.dom.createElement('button')
  closeButton.setAttribute('id', buttonID)
  closeButton.setAttribute('type', 'button')
  closeButton.setAttribute('aria-label', 'Close dialog')
  closeButton.classList.add('contacts-dialog__close', specialClass)
  closeButton.addEventListener('click', setButtonOnClickHandler)
  render(closeIcon, closeButton)
  return closeButton
}   

function createDialogCancelButton(
  context: DataBrowserContext,
  _element: HTMLElement
): HTMLButtonElement {
  const cancelButton = context.dom.createElement('button')
  cancelButton.setAttribute('type', 'button')
  cancelButton.classList.add('contacts-dialog__cancel', 'contacts-dialog__cancel--footer')
  cancelButton.textContent = dialogCancelLabelText
  cancelButton.addEventListener('click', (event) => {
    event.preventDefault()
    const sharedCancelButton = context.dom.querySelector('#profile-modal #modal-buttons button[data-cancel]') as HTMLButtonElement | null
    if (sharedCancelButton) {
      sharedCancelButton.click()
    }
  })
  return cancelButton
}

function createPopupSection(
  context: DataBrowserContext,
  className: string
): HTMLDivElement {
  const section = context.dom.createElement('div')
  section.classList.add(className)
  return section
}

function createInlinePanelRegion(context: DataBrowserContext): HTMLElement {
  const region = context.dom.createElement('section')
  region.setAttribute('id', 'contacts-inline-panel-region')
  region.classList.add('contacts-dialog__inline-panel-region')
  region.setAttribute('aria-live', 'polite')
  return region
}

function refreshAddressBookDialogContents(
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData,
  addressBooksData: AddressBooksData,
  selectedAddressBookUri: string | null,
  selectedGroupUri: string | null
): void {
  const detailsSection = context.dom.getElementById('addressbook-details-section')
  if (!detailsSection || !addressBooksData) return

  const addressBookListSection = createAddressBookListSection(context, contactsModule, contactData, addressBooksData)
  const inlinePanelRegion = createInlinePanelRegion(context)

  detailsSection.replaceChildren()
  detailsSection.appendChild(addressBookListSection)

  if (selectedAddressBookUri) {
    const selectedAddressBook = addressBooksData.public.get(selectedAddressBookUri) || addressBooksData.private.get(selectedAddressBookUri)
    if (selectedAddressBook) {
      const groupListSection = createGroupListSection(context, contactsModule, addressBooksData, selectedAddressBook, contactData)
      detailsSection.appendChild(groupListSection)
    }
  }

  detailsSection.appendChild(inlinePanelRegion)

  if (selectedAddressBookUri) {
    const selectedAddressBookButton = context.dom.getElementById(selectedAddressBookUri)
    if (selectedAddressBookButton) {
      selectedAddressBookButton.classList.add('contacts-dialog__list-button--selected')
    }
  }

  if (selectedGroupUri) {
    const selectedGroupButton = context.dom.getElementById(selectedGroupUri)
    if (selectedGroupButton) {
      selectedGroupButton.classList.add('contacts-dialog__list-button--selected')
    }
  }

  syncAddContactActionState(context)
}

function resetSelectedAddressBookState(context: DataBrowserContext): void {
  const selectedAddressBookElements = context.dom.querySelectorAll('#addressbook-list .contacts-dialog__list-button--selected')
  selectedAddressBookElements.forEach((addressBookButton) => {
    addressBookButton.classList.remove('contacts-dialog__list-button--selected')
  })

  const groupListSection = context.dom.getElementById('group-list')
  if (groupListSection) groupListSection.remove()
  syncAddContactActionState(context)
}

function clearInlinePanel(context: DataBrowserContext): void {
  const region = context.dom.getElementById('contacts-inline-panel-region')
  if (!region) return

  region.replaceChildren()
  region.classList.remove('contacts-dialog__inline-panel-region--active')
  syncAddContactActionState(context)
}

function renderInlinePanel(context: DataBrowserContext, element: HTMLElement): void {
  const region = context.dom.getElementById('contacts-inline-panel-region')
  if (!region) return

  region.replaceChildren()
  element.classList.add('contacts-dialog__inline-panel')
  region.appendChild(element)
  region.classList.add('contacts-dialog__inline-panel-region--active')
  syncAddContactActionState(context)
  focusFirstInputInPopup(element)
}

function syncAddContactActionState(context: DataBrowserContext): void {
  const selectedAddressBook = context.dom.querySelector('#addressbook-list .contacts-dialog__list-button--selected')
  const selectedGroup = context.dom.querySelector('#group-list .contacts-dialog__list-button--selected')
  const inlinePanelRegion = context.dom.getElementById('contacts-inline-panel-region')
  const hasActiveInlinePanel = inlinePanelRegion?.classList.contains('contacts-dialog__inline-panel-region--active') ?? false

  setAddContactActionDisabled(context, !(selectedAddressBook && selectedGroup) || hasActiveInlinePanel)
}

function setAddContactActionDisabled(context: DataBrowserContext, disabled: boolean): void {
  const actionButton = context.dom.getElementById('contacts-submit-contact-button') as HTMLButtonElement | null
  if (!actionButton) return
  actionButton.disabled = disabled
  actionButton.setAttribute('aria-disabled', String(disabled))
}

const createGroupNameForm = (
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData, 
  contactData: ContactData
): HTMLFormElement => {
  let submitButton: HTMLButtonElement | null = null

  const addGroupEventListener = async (event) => {
    event.preventDefault()
    await runWithButtonLoading(context, submitButton, 'Creating...', async () => {
      let selectedAddressBookUri = null 

      const selectedAddressBookElements = context.dom.querySelectorAll('#addressbook-list .contacts-dialog__list-button--selected')
      selectedAddressBookElements.forEach((addressBookButton) => {
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
        try {
          const selectedAddressBookNode = new NamedNode(selectedAddressBookUri)
          const newGroupNode = await saveNewGroupToAddressBook(context, selectedAddressBookNode, enteredGroupName)
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
          clearInlinePanel(context)
          removePopupOverlayIfNoPopup(context)
        } catch (error) {
          addErrorToErrorDisplay(context, `${errorGroupCreation}\n${error}`)
        }
      }
    })
  } 
  
  const newGroupForm = context.dom.createElement('form')
  newGroupForm.setAttribute('aria-labelledby', 'new-group-form-title')
  newGroupForm.addEventListener('submit', addGroupEventListener) 
  newGroupForm.setAttribute('id', 'new-group-form')
  newGroupForm.classList.add('contacts-dialog__popup', 'contacts-dialog__group-form')
  
  const groupNameLabel = context.dom.createElement('label')
  groupNameLabel.setAttribute('for', 'groupNameInput')
  const groupNameLabelText = context.dom.createElement('span')
  groupNameLabelText.classList.add('sr-only')
  groupNameLabelText.textContent = 'Group name'
  groupNameLabel.appendChild(groupNameLabelText)

  const groupNameInputBox = context.dom.createElement('input')
  groupNameInputBox.type = 'text' 
  groupNameInputBox.name = 'groupName' 
  groupNameInputBox.id = 'groupNameInput' 
  groupNameInputBox.placeholder = 'New group name' 
  groupNameInputBox.classList.add('input', 'contacts-dialog__group-input')

  const validationMessage = createValidationMessage(context)

  attachSanitizingValidation(groupNameInputBox, validationMessage)
 
  submitButton = createAddGroupButton(context, newGroupForm)
  const closeButton = createCloseButton(context, newGroupForm, 'contacts-dialog__close--group-create')
  const popupBody = createPopupSection(context, 'contacts-dialog__popup-body')
  const popupFooter = createPopupSection(context, 'contacts-dialog__popup-footer')

  newGroupForm.appendChild(createPopupHeader(context, 'Create a new group', 'new-group-form-title', closeButton))
  popupBody.appendChild(groupNameLabel)
  popupBody.appendChild(groupNameInputBox)
  popupBody.appendChild(validationMessage)
  popupFooter.appendChild(submitButton)
  newGroupForm.appendChild(popupBody)
  newGroupForm.appendChild(popupFooter)
    
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
  button.textContent = 'Create Group'
  button.classList.add('contacts-dialog__action-button', 'contacts-dialog__action-button--primary')
  button.addEventListener('click', setButtonOnClickHandler)
  return button
}     

const handleContactExistsFromNonRegisteredAddressBook = (
  context: DataBrowserContext,
  addressBooksData: AddressBooksData,
  contactData: ContactData,
  contactExistsByWebID: boolean,
  contactExistsByNameUri: string,
): boolean => {
  

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
): boolean => {
  const selectorDialog = context.dom.getElementById('contacts-addressbook-picker-dialog')
  const buttonContainer = getButtonContainer(context)
  
  const contactExistsDialog = context.dom.createElement('section')
  contactExistsDialog.setAttribute('role', 'alertdialog')
  contactExistsDialog.setAttribute('aria-modal', 'true')
  contactExistsDialog.setAttribute('aria-labelledby', 'contacts-contact-exists-title')
  contactExistsDialog.setAttribute('aria-describedby', 'contacts-contact-exists-message')
  contactExistsDialog.classList.add('contacts-dialog__popup', 'contacts-dialog__contact-exists')

  const popupBody = createPopupSection(context, 'contacts-dialog__popup-body')
  const popupFooter = createPopupSection(context, 'contacts-dialog__popup-footer')

  const heading = context.dom.createElement('h3')
  heading.setAttribute('id', 'contacts-contact-exists-title')
  heading.classList.add('contacts-dialog__title', 'contacts-dialog__title--popup')
  heading.textContent = 'Contact already exists'

  const message = context.dom.createElement('p')
  message.setAttribute('id', 'contacts-contact-exists-message')
  message.textContent = `${contactData.name} already exists. Do you want to add their WebID?`
  
  const confirmButton = context.dom.createElement('button')
  confirmButton.setAttribute('type', 'button')
  confirmButton.classList.add('contacts-dialog__action-button', 'contacts-dialog__action-button--primary', 'contacts-dialog__confirm')
  confirmButton.innerHTML = 'Yes'
  confirmButton.addEventListener('click', async (event) => {
    event.preventDefault()
    await runWithButtonLoading(context, confirmButton, 'Adding...', async () => {
      await addWebIDToExistingContact(context, contactData, contactExistsByNameUri)
      contactExistsDialog.remove()
      finalizeContactEntry(context, addressBooksData, contactData, addressBooksData.contactWebIDs.get(contactData.webID))
      refreshButton(context, addressBooksData, contactData)
    })
  })

  const cancelButton = context.dom.createElement('button')
  cancelButton.setAttribute('type', 'button')
  cancelButton.classList.add('contacts-dialog__cancel')
  cancelButton.innerHTML = 'No'
  cancelButton.addEventListener('click', (event) => {
    event.preventDefault()
    if (!fromRegisteredAddressBook) {
      selectorDialog.remove()
    }
    
    contactExistsDialog.remove()
    complain(getButtonContainer(context), context, 'Contact was not added')
    setTimeout(() => {
      clearPreviousMessage(getButtonContainer(context))
    }, 2000)  
      refreshButton(context, addressBooksData, contactData)  
  })

  popupBody.appendChild(heading)
  popupBody.appendChild(message)
  popupFooter.appendChild(confirmButton)
  popupFooter.appendChild(cancelButton)

  contactExistsDialog.appendChild(popupBody)
  contactExistsDialog.appendChild(popupFooter)
  showPopupOverlay(context)
  if (fromRegisteredAddressBook) {
    if (buttonContainer) buttonContainer.appendChild(contactExistsDialog)
  } else {
    if (selectorDialog) selectorDialog.appendChild(contactExistsDialog)
  }
  setTimeout(() => confirmButton.focus(), 0)
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
    if (selectorDialog) {
      selectorDialog.remove()
    }
    
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
    
    const selectedGroupButton = event.target as HTMLButtonElement
    const previouslySelected = selectedGroupButton.classList.contains('contacts-dialog__list-button--selected') 
    
    if (previouslySelected) {
      selectedGroupButton.classList.remove('contacts-dialog__list-button--selected')
      checkAndAddErrorToDisplay(context, groupIsRequired)
    } else {
      selectedGroupButton.classList.add('contacts-dialog__list-button--selected') 
      checkAndRemoveErrorDisplay(context)
    }

    selectedGroupButton.blur()
    syncAddContactActionState(context)
  } 

  const button = context.dom.createElement('button')
  button.setAttribute('value', group.name)
  button.setAttribute('id', group.uri)
  button.setAttribute('type', 'button')
  button.setAttribute('aria-labelledby', group.name)
  button.classList.add('contacts-dialog__list-button')
  button.addEventListener('click', setButtonOnClickHandler)
  button.textContent = group.name

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
  overlay.setAttribute('id', CONTACTS_POPUP_OVERLAY_ID)
  overlay.classList.add('contacts-dialog__popup-overlay')
  selectorDialog.appendChild(overlay)
}

const removePopupOverlayIfNoPopup = (
  context: DataBrowserContext
): void => {
  const selectorDialog = context.dom.getElementById('contacts-addressbook-picker-dialog')
  if (!selectorDialog) return

  const activePopup = selectorDialog.querySelector('.contacts-dialog__popup, .contacts-dialog__contact-exists')
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

function sanitizeInputForTyping(input: string): string {
  return (input || '')
    .replace(/[^a-zA-Z0-9 ]+/g, '')
}

function attachSanitizingValidation(input: HTMLInputElement, feedbackElement: HTMLElement): void {
  input.addEventListener('input', () => {
    const rawValue = input.value
    const sanitizedValue = sanitizeInputForTyping(rawValue)

    if (rawValue !== sanitizedValue) {
      input.value = sanitizedValue
      input.setAttribute('aria-invalid', 'true')
      feedbackElement.textContent = 'Only letters, numbers, and spaces are allowed.'
      feedbackElement.classList.add('contacts-dialog__validation--visible')
      feedbackElement.setAttribute('aria-hidden', 'false')
      return
    }

    input.removeAttribute('aria-invalid')
    feedbackElement.textContent = ''
    feedbackElement.classList.remove('contacts-dialog__validation--visible')
    feedbackElement.setAttribute('aria-hidden', 'true')
  })
}

function createValidationMessage(context: DataBrowserContext): HTMLParagraphElement {
  const validationMessage = context.dom.createElement('p')
  validationMessage.setAttribute('role', 'status')
  validationMessage.setAttribute('aria-live', 'polite')
  validationMessage.classList.add('contacts-dialog__validation')
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

function focusFirstInputInPopup(container: HTMLElement): void {
  setTimeout(() => {
    const firstInput = container.querySelector('input, textarea, select') as HTMLElement | null
    if (firstInput) firstInput.focus()
  }, 0)
}

function setButtonLoadingState(button: HTMLButtonElement | null, isLoading: boolean, loadingLabel?: string): void {
  if (!button) return

  const originalLabel = button.dataset.originalLabel || button.textContent || ''
  if (!button.dataset.originalLabel) button.dataset.originalLabel = originalLabel

  if (isLoading) {
    button.disabled = true
    button.setAttribute('aria-busy', 'true')
    button.textContent = loadingLabel || originalLabel
    return
  }

  button.disabled = false
  button.removeAttribute('aria-busy')
  button.textContent = button.dataset.originalLabel || originalLabel
}

async function runWithButtonLoading<T>(context: DataBrowserContext, button: HTMLButtonElement | null, loadingLabel: string, action: () => Promise<T>): Promise<T> {
  const sharedModal = context.dom.getElementById('profile-modal') as HTMLDialogElement | null
  const useDialogOverlay = Boolean(sharedModal?.hasAttribute('open'))

  if (useDialogOverlay) {
    if (button) {
      button.disabled = true
      button.setAttribute('aria-busy', 'true')
    }
    setSharedDialogSavingState(context.dom, true, loadingLabel)
  } else {
    setButtonLoadingState(button, true, loadingLabel)
  }

  try {
    return await action()
  } finally {
    if (useDialogOverlay) {
      setSharedDialogSavingState(context.dom, false, loadingLabel)
      if (button) {
        button.disabled = false
        button.removeAttribute('aria-busy')
      }
    } else {
      setButtonLoadingState(button, false)
    }
  }
}

function sanitizeGroupFileName(name: string): string {
  return name.replace(/\W/gu, '_').replace(/_+/g, '_')
}

function getDocumentKey(statementDocument: ReturnType<typeof st>['why']): string {
  return 'value' in statementDocument ? statementDocument.value : '__default__'
}

async function updateAcrossDocuments(
  context: DataBrowserContext,
  deletions: Array<ReturnType<typeof st>>,
  insertions: Array<ReturnType<typeof st>> = []
): Promise<void> {
  const store = context.session.store
  const docs = deletions.concat(insertions).map((statement) => statement.why)
  const uniqueDocKeys = new Set<string>()
  const uniqueDocs = docs.filter((doc) => {
    const key = getDocumentKey(doc)
    if (uniqueDocKeys.has(key)) return false
    uniqueDocKeys.add(key)
    return true
  })

  await Promise.all(uniqueDocs.map((doc) =>
    store.updater.update(
      deletions.filter((statement) => getDocumentKey(statement.why) === getDocumentKey(doc)),
      insertions.filter((statement) => getDocumentKey(statement.why) === getDocumentKey(doc))
    )
  ))
}

async function saveNewGroupToAddressBook(
  context: DataBrowserContext,
  addressBookNode: NamedNode,
  name: string
): Promise<NamedNode> {
  const store = context.session.store

  await store.fetcher.load(addressBookNode.doc())
  const groupIndex = store.any(addressBookNode, ns.vcard('groupIndex')) as NamedNode | null
  if (!groupIndex) {
    throw new Error('Error loading group index for the selected address book.')
  }

  const groupFileName = sanitizeGroupFileName(name)
  const groupNode = sym(`${addressBookNode.dir().uri}Group/${groupFileName}.ttl#this`) as NamedNode
  const groupDocument = groupNode.doc()

  try {
    await store.fetcher.load(groupIndex)
  } catch (error) {
    throw new Error(`Error loading group index ${groupIndex.value}: ${error}`)
  }

  if (store.holds(addressBookNode, ns.vcard('includesGroup'), groupNode, groupIndex)) {
    return groupNode
  }

  const indexInsertions = [
    st(addressBookNode, ns.vcard('includesGroup'), groupNode, groupIndex),
    st(groupNode, ns.rdf('type'), ns.vcard('Group'), groupIndex),
    st(groupNode, ns.vcard('fn'), literal(name), groupIndex)
  ]

  const groupInsertions = [
    st(addressBookNode, ns.vcard('includesGroup'), groupNode, groupDocument),
    st(groupNode, ns.rdf('type'), ns.vcard('Group'), groupDocument),
    st(groupNode, ns.vcard('fn'), literal(name), groupDocument)
  ]

  await updateAcrossDocuments(context, [], indexInsertions)
  await updateAcrossDocuments(context, [], groupInsertions)

  return groupNode
}
