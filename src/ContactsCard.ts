import { DataBrowserContext } from "pane-registry"
import { widgets } from "solid-ui"
import { addAddressToPublicTypeIndex, addANewAddressBookUriToAddressBooks, addWebIDToExistingContact, checkIfContactExistsByName, checkIfContactExistsByWebID, createContactInAddressBook, refreshButton } from "./contactsHelpers"
import { AddressBookDetails, AddressBooksData, ContactData, GroupData } from "./contactsTypes"
import ContactsModuleRdfLib from "@solid-data-modules/contacts-rdflib"
import { authn } from "solid-logic"
import { clearPreviousMessage, mention } from "./buttonsHelper"
import { contactExistsMessage, contactWasAddedSuccesMessage, errorAddressBookCreation, errorContactCreation, errorGroupCreation, errorNotExistsAddressBookUri, groupIsRequired } from "./texts"
import { addErrorToErrorDisplay, checkAndAddErrorDisplay } from "./contactsErrors"

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

  const closeButton = context.dom.createElement('button')
  closeButton.classList.add('contactsCloseButton')
  closeButton.textContent = 'X'
  closeButton.onclick = (event) => {
    event.preventDefault()
    const elementToClose = context.dom.getElementById('contacts-selector-dialog')
    elementToClose.remove()
    
    button.removeAttribute('disabled')
  }

  const addressBookUriEntryDiv = createAddressBookUriEntryDiv(context, contactsModule, addressBooksData, contactData)
  const addressBookDetailsSection = createAddressBookDetailsSection(context)
  const errorDisplaySection = createErrorDisplaySection(context)  
  const addressBookListDiv = createAddressBookListDiv(context, contactsModule, contactData, addressBooksData, addressBookDetailsSection)
  const groupListDiv = createGroupListDiv(context, null)
  addressBookDetailsSection.appendChild(addressBookListDiv)
  addressBookDetailsSection.appendChild(groupListDiv)

  
  addressBookUriSelectorDialog.appendChild(closeButton)
  addressBookUriSelectorDialog.appendChild(addressBookDetailsSection)
  addressBookUriSelectorDialog.appendChild(addressBookUriEntryDiv)
  addressBookUriSelectorDialog.appendChild(errorDisplaySection)
  addressBookUriSelectorDialog.appendChild(createNewAddressBookForm(context, addressBooksData, contactsModule, contactData))
  
  return addressBookUriSelectorDialog
}

export const createAddressBookDetailsSection = (
  context: DataBrowserContext
): HTMLElement => {
  const addressBookDetailsSection = context.dom.createElement('section')
  addressBookDetailsSection.setAttribute('id', 'addressBookDetailsSection')
  addressBookDetailsSection.setAttribute('role', 'addressBookDetails')
  addressBookDetailsSection.setAttribute('aria-live', 'polite')
  addressBookDetailsSection.setAttribute('tabindex', '0')
  addressBookDetailsSection.classList.add('contactsAddressBookDetails')

  return addressBookDetailsSection
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
  addressBookUriEntryDiv.classList.add('contactsAddressBookUriEntry')

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
    console.log("button clicked" )
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
          addressBookListDiv.appendChild(createAddressBookButton(context, contactsModule, books.addressBooksData, books.addressBook, enteredAddressBookUri, contactData, 'private'))
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
  addressBookUriEntryForm.appendChild(createAddressUriEntryButton(context))
  
  return addressBookUriEntryForm
}

const createAddressUriEntryButton = (
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
  entryButton.classList.add('contactsAddressBookUriEntryButton')
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

  groupListDiv.innerHTML = "Groups"
  if (addressBook) {
    addressBook.groups.map((group) => {
        groupListDiv.appendChild(createGroupButton(context, group))
    })
  } 
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

const createSubmitButton = (
  context: DataBrowserContext,
  form: HTMLFormElement
): HTMLButtonElement => {
  const setButtonOnClickHandler = async (event) => {
    event.preventDefault()
    form.requestSubmit()
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
  button.attributeStyleMap.clear()
  button.innerHTML = 'Add Contact'
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
    const addressBookUriSelectorDialog = context.dom.getElementById('contacts-selector-dialog')
    let addressBook = null
    // remove the previous groups
    const groupDivToRemove = context.dom.getElementById('group-list')
    if (groupDivToRemove) groupDivToRemove.remove()
    
    // attach a blank Group Div
    const groupListDiv = createGroupListDiv(context, null)
    const addressBookDetailsSection = context.dom.getElementById('addressBookDetailsSection')
    addressBookDetailsSection.appendChild(groupListDiv)
    
    // remove presious address book selection bc you can only have one
    const selectedAddressBookElements = context.dom.querySelectorAll('.selectedAddressBook')
    selectedAddressBookElements.forEach((addressBookButton) => {
      addressBookButton.classList.remove("contactsSelectedButton", "selectedAddressBook")
    })
    
    if (previouslySelected) {
      selectedAddressBookButton.classList.remove("contactsSelectedButton", "selectedAddressBook");
      const groupForm = context.dom.getElementById('new-group-form')
      if (groupForm) groupForm.remove() 
      addressBookUriSelectorDialog.appendChild(createNewAddressBookForm(context, addressBooksData, contactsModule, contactData)) 
    } else {
      const addressForm = context.dom.getElementById('new-addressbook-form')
      if (addressForm) addressForm.remove()
      // display group form
      const groupForm = context.dom.getElementById('new-group-form')
      if (!groupForm) addressBookUriSelectorDialog.appendChild(createGroupNameForm(context, addressBooksData, contactsModule, contactData))

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
      const groupListDiv = createGroupListDiv(context, addressBook)  
      const addressBookDetailsSection = context.dom.getElementById('addressBookDetailsSection')
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
    let selectedGroupUris = []
    let enteredAddressBookUri = null 

    const addressNameField = context.dom.querySelector('#addressBookNameInput')

    // @ts-ignore
    const enteredAddressName = addressNameField.value

    const addressContainerField = context.dom.querySelector('#addressBookContainerInput')

    // will use this later, hoping solid-data-modules will handle it
    // @ts-ignore
    const enteredAddressContainer = addressContainerField.value

    const selectedresourceTypeRadio = context.dom.querySelector('input[name="address-type"]:checked')
    // @ts-ignore
    const resourceType = selectedresourceTypeRadio.value
    
    const groupNameField = context.dom.querySelector('#groupNameInput')
    // @ts-ignore
    const enteredGroupName = groupNameField.value

    if (enteredAddressName) {
      // add addressbook first 
      try {
        enteredAddressBookUri = await handleAddressBookCreation(context, contactsModule, enteredAddressName,resourceType)
        if (enteredGroupName) {
          const newGroupUri = await contactsModule.createNewGroup({addressBookUri: enteredAddressBookUri, groupName: enteredGroupName })
          selectedGroupUris.push(newGroupUri)
        }
        const selectedAddressBookUris = { 
        addressBookUri: enteredAddressBookUri,
        groupUris: selectedGroupUris 
        }
        const contactUri = await createContactInAddressBook(context, contactsModule, addressBooksData, contactData, selectedAddressBookUris)
        finalizeContactEntry(context, addressBooksData, contactData, contactUri)
      } catch (error) {
        addErrorToErrorDisplay(context, error)
      }
  
    } 
  }   
  const newAddressBookForm = context.dom.createElement('form')
  newAddressBookForm.method = 'post'
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
  addressBookTypeIndexDiv.setAttribute('role', 'checkboxgroup')
  addressBookTypeIndexDiv.classList.add('contactsAddressTypeIndexInput')
  addressBookTypeIndexDiv.innerHTML = "Add to your type index (optional)"

  const addressBookPublicTypeIndexDiv = context.dom.createElement('div')
  addressBookPublicTypeIndexDiv.setAttribute('id', 'addressBookPublicTypeIndexDiv')
  addressBookPublicTypeIndexDiv.setAttribute('role', 'checkboxgroup')
  addressBookPublicTypeIndexDiv.classList.add('contactsAddressTypeIndexInputGroup')

  const addressBookPublicTypeIndexCheckBoxLabel = context.dom.createElement('label')
  addressBookPublicTypeIndexCheckBoxLabel.classList.add('contactsCheckBoxLabel')
  addressBookPublicTypeIndexCheckBoxLabel.innerHTML = 'Public Type Index '
  addressBookPublicTypeIndexCheckBoxLabel.setAttribute('for', 'publicTypeIndex')

  const addressBookPublicTypeIndexCheckBox = context.dom.createElement('input')
  addressBookPublicTypeIndexCheckBox.classList.add('contactsCheckBoxInput')
  addressBookPublicTypeIndexCheckBox.type = 'checkbox';
  addressBookPublicTypeIndexCheckBox.id = 'publicTypeIndex';
  addressBookPublicTypeIndexCheckBox.name = 'address-type-index';
  addressBookPublicTypeIndexCheckBox.value = 'publicTypeIndex';

  addressBookPublicTypeIndexDiv.appendChild(addressBookPublicTypeIndexCheckBoxLabel)
  addressBookPublicTypeIndexDiv.appendChild(addressBookPublicTypeIndexCheckBox)

  const addressBookPrivateTypeIndexDiv = context.dom.createElement('div')
  addressBookPrivateTypeIndexDiv.setAttribute('id', 'addressBookPrivateTypeIndexDiv')
  addressBookPrivateTypeIndexDiv.setAttribute('role', 'checkboxgroup')
  addressBookPrivateTypeIndexDiv.classList.add('contactsAddressTypeIndexInputGroup')

  const addressBookPrivateTypeIndexCheckBoxLabel = context.dom.createElement('label')
  addressBookPrivateTypeIndexCheckBoxLabel.classList.add('contactsCheckBoxLabel')
  addressBookPrivateTypeIndexCheckBoxLabel.innerHTML = 'Private Type Index'
  addressBookPrivateTypeIndexCheckBoxLabel.setAttribute('for', 'privateTypeIndex')

  const addressBookPrivateTypeIndexCheckBox = context.dom.createElement('input')
  addressBookPrivateTypeIndexCheckBox.classList.add('contactsCheckBoxInput')
  addressBookPrivateTypeIndexCheckBox.type = 'checkbox';
  addressBookPrivateTypeIndexCheckBox.id = 'privateTypeIndex';
  addressBookPrivateTypeIndexCheckBox.name = 'address-type-index';
  addressBookPrivateTypeIndexCheckBox.value = 'privateTypeIndex';

  addressBookPrivateTypeIndexDiv.appendChild(addressBookPrivateTypeIndexCheckBoxLabel)
  addressBookPrivateTypeIndexDiv.appendChild(addressBookPrivateTypeIndexCheckBox)

  addressBookTypeIndexDiv.appendChild(addressBookPublicTypeIndexDiv)
  addressBookTypeIndexDiv.appendChild(addressBookPrivateTypeIndexDiv)

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
  const submitButton = createSubmitButton(context, newAddressBookForm)
  
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

async function handleAddressBookCreation(
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  enteredAddressName: string,
  resourceType: string
): Promise<string> {
  const me = authn.currentUser()
  const newAddressContainer = me.site().value 
  let addressBookUri = null
  
  try {
    if (resourceType === 'public') {
      addressBookUri = await contactsModule.createAddressBook({
        containerUri: newAddressContainer,
        name: enteredAddressName
      })
      await addAddressToPublicTypeIndex(context, addressBookUri)
    } else {
      addressBookUri = await contactsModule.createAddressBook({
        containerUri: newAddressContainer,
        name: enteredAddressName,
        ownerWebId: me.uri
      })
    }
} catch (error) {
  addErrorToErrorDisplay(context, errorAddressBookCreation + "\n" + error)
}
  return addressBookUri
}

const createGroupNameForm = (
  context: DataBrowserContext,
  addressBooksData: AddressBooksData, 
  contactsModule: ContactsModuleRdfLib,
  contactData: ContactData
): HTMLFormElement => {
  const inputGroupEventListener = () => {
    checkAndRemoveErrorDisplay(context)
  }

  const addContactEventListener = async (event) => {
    event.preventDefault()
    let selectedAddressBookUri = null 
    let selectedGroupUris = []

    const contactExistsByName = checkIfContactExistsByName(addressBooksData, contactData.name)
    const contactExistsByWebID = checkIfContactExistsByWebID(addressBooksData, contactData.webID)

    if (contactExistsByName || contactExistsByWebID) {
      handleContactExists(context, contactsModule, addressBooksData, contactData, contactExistsByWebID, contactExistsByName)
      return
    }

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
    if (selectedGroupUris.length != 0 || enteredGroupName) {
      if (enteredGroupName) {
        // add group first 
        try {
          const newGroupUri = await contactsModule.createNewGroup({addressBookUri: selectedAddressBookUri, groupName: enteredGroupName })
          selectedGroupUris.push(newGroupUri)
        } catch (error) {
          addErrorToErrorDisplay(context, `${errorGroupCreation}\n${error}`)
        }  
      }
    
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
  
  const newGroupForm = context.dom.createElement('form')
  newGroupForm.addEventListener('submit', addContactEventListener) 
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
  groupNameInputBox.addEventListener('click', inputGroupEventListener)
  
  const submitButton = createSubmitButton(context, newGroupForm)
  submitButton.setAttribute('type', 'submit')

  newGroupForm.appendChild(groupNameLabel)
  newGroupForm.appendChild(groupNameInputBox)
  newGroupForm.appendChild(submitButton)
    
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
      return
    } else if (contactExistsByName) {
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
        mention(getButtonContainer(context), 'Contact was not added')
        setTimeout(() => {
          clearPreviousMessage(getButtonContainer(context))
        }, 2000); 
        refreshButton(context, addressBooksData, contactData)  
      })

      contactExistsDiv.appendChild(confirmButton)
      contactExistsDiv.appendChild(cancelButton)
      selectorDialog.appendChild(contactExistsDiv)  
    }
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
