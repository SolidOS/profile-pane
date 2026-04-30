import { html, render, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { authn } from 'solid-logic'
import { LiveStore, NamedNode } from 'rdflib'
import {
  clearPreviousMessage, complain, checkIfAnyUserLoggedIn
} from '../../buttonsHelper'
import { getContactData, getAddressBooksData, checkIfContactExistsByWebID, checkIfContactExistsByName } from './selectors'
import { addContactToAddressBook } from './mutations'
import { AddressBooksData, ContactData } from './contactsTypes'
import {
  addMeToYourContactsButtonText, contactExistsAlreadyButtonText, contactExistsAlreadyByNameButtonText, contactExistsMessage, logInAddMeToYourContactsButtonText, userNotLoggedInErrorMessage,
  errorAddingContactWebIDToAddressBook
} from '../../texts'
import '../../styles/AddMeToYourContacts.css'
import type ContactsModuleRdfLib from '@solid-data-modules/contacts-rdflib'
import { addErrorToErrorDisplay } from './contactsErrors'
import { handleContactExistsByName } from './ContactCreationDialog'
import { plusIcon } from '../../icons-svg/profileIcons'

function renderAddToContactsButtonLabel(button: HTMLButtonElement, label: string, showIcon = false): void {
  const buttonDocument = button.ownerDocument
  const content: Node[] = []

  if (showIcon) {
    const iconWrapper = buttonDocument.createElement('span')
    iconWrapper.className = 'profile__btn-contacts-icon'
    iconWrapper.setAttribute('aria-hidden', 'true')
    render(plusIcon, iconWrapper)
    content.push(iconWrapper)
  }

  const labelWrapper = buttonDocument.createElement('span')
  labelWrapper.className = 'profile__btn-contacts-label'
  labelWrapper.textContent = label
  content.push(labelWrapper)

  button.replaceChildren(...content)
}
let buttonContainer = <HTMLDivElement>document.createElement('section')

const addMeToYourContactsDiv = async (
  subject: NamedNode,
  context: DataBrowserContext
): Promise<TemplateResult> => {
  
  buttonContainer = context.dom.createElement('section') as HTMLDivElement
  buttonContainer.setAttribute('id', 'add-to-contacts-button-container')
  buttonContainer.setAttribute('class', 'profile-contacts-button__section text-truncate text-center section-centered')
  buttonContainer.setAttribute('aria-labelledby', 'add-me-to-your-contacts-button-section')
  buttonContainer.setAttribute('data-testid', 'button')

  // Add a visually hidden heading for accessibility
  const heading = context.dom.createElement('h3')
  heading.setAttribute('id', 'add-me-to-your-contacts-button-section')
  heading.setAttribute('class', 'sr-only')
  heading.textContent = 'Add me to your contacts actions'
  buttonContainer.appendChild(heading)

  const button = await createAddMeToYourContactsButton(subject, context)
  button.classList.add('profile__action-button', 'profile__btn-contacts', 'flex-center')
  buttonContainer.appendChild(button)
  return html`${buttonContainer}`
}

const createAddMeToYourContactsButton = async (
  subject: NamedNode,
  context: DataBrowserContext
): Promise<HTMLButtonElement> => {
  const me = authn.currentUser()
  
  let addressBooksData = null
  let contactData = null
  const store: LiveStore = context.session.store
  const fetcher = store.fetcher
  const updater = store.updater
  const { default: ContactsModuleRdfLib } = await import('@solid-data-modules/contacts-rdflib')
  const contactsModule = new ContactsModuleRdfLib({ store, fetcher, updater})

  try {
    addressBooksData = await getAddressBooksData(context, contactsModule)
    contactData = await getContactData(store, subject)   
  } catch (error) {
    addErrorToErrorDisplay(context, error)
  }
  function setButtonHandler(event) {
    event.preventDefault()
    saveNewContact(subject, context, contactsModule, addressBooksData)
      .catch((error) => {
        clearPreviousMessage(buttonContainer)
        complain(buttonContainer, context, error)
      })
  }
  const label = checkIfAnyUserLoggedIn(me) ? addMeToYourContactsButtonText : logInAddMeToYourContactsButtonText
  const button = context.dom.createElement('button') as HTMLButtonElement & { refresh?: () => void }
  button.type = 'button'
  button.addEventListener('click', setButtonHandler)
  button.setAttribute('id', 'add-to-contacts-button')
  renderAddToContactsButtonLabel(button, label, checkIfAnyUserLoggedIn(me))
  button.refresh = refreshButton
  refreshButton()
  
  function refreshButton() {
    if (checkIfAnyUserLoggedIn(me)) {
      button.disabled = false
      button.removeAttribute('disabled')

      const contactExistsByWebID = (contactData) ? checkIfContactExistsByWebID(addressBooksData, contactData.webID) : false
      const contactExistsByName = (contactData) ? checkIfContactExistsByName(addressBooksData, contactData.name) : false
      if (contactExistsByWebID) {
        renderAddToContactsButtonLabel(button, contactExistsAlreadyButtonText)
        button.disabled = true
        button.setAttribute('disabled', 'true')
      } else if (contactExistsByName) {
        renderAddToContactsButtonLabel(button, contactExistsAlreadyByNameButtonText)
      } else {
        renderAddToContactsButtonLabel(button, addMeToYourContactsButtonText, true)
      }
    } else {
      renderAddToContactsButtonLabel(button, logInAddMeToYourContactsButtonText)
    }
  }
  return button
}

async function saveNewContact(
  subject: NamedNode,
  context: DataBrowserContext,
  contactsModule: ContactsModuleRdfLib,
  addressBooksData: AddressBooksData
): Promise<void> {
  const me = authn.currentUser()
  const store: LiveStore = context.session.store

// need to find out where the user wants to add the Contact
  if (checkIfAnyUserLoggedIn(me)) {
    if (!(checkIfContactExistsByWebID(addressBooksData, subject.value))) {
      //if contact does not exist, we add her/him
      await store.fetcher.load(me)
      try {
        const contactData: ContactData = await getContactData(store, subject) 
        const contactExistsByNameUri = checkIfContactExistsByName(addressBooksData, contactData.name)
        if (contactExistsByNameUri) {
          const fromRegisteredAddressBook = true
          const handled = handleContactExistsByName(context, addressBooksData, contactData, contactExistsByNameUri, fromRegisteredAddressBook)
            if (!handled) addErrorToErrorDisplay(context, errorAddingContactWebIDToAddressBook)
        } else {
          await addContactToAddressBook(context, contactsModule, contactData, addressBooksData, buttonContainer)
        }
      } catch (error) {
        let errorMessage = error
        if (errorMessage.toString().includes('Unauthenticated'))
          errorMessage = userNotLoggedInErrorMessage
        throw new Error(errorMessage)
      }
    } 
      else throw new Error(contactExistsMessage)
  } else throw new Error(userNotLoggedInErrorMessage)
}

export {
  addMeToYourContactsDiv,
  createAddMeToYourContactsButton,
  saveNewContact
}
