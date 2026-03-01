import { html, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { authn } from 'solid-logic'
import { LiveStore, NamedNode } from 'rdflib'
import { widgets } from 'solid-ui'
import {
  clearPreviousMessage, complain, checkIfAnyUserLoggedIn
} from './buttonsHelper'
import { getContactData, getAddressBooksData, addContactToAddressBook, checkIfContactExistsByWebID, checkIfContactExistsByName, addWebIDToExistingContact } from './contactsHelpers'
import { AddressBooksData, ContactData } from './contactsTypes'
import {
  addMeToYourContactsButtonText, contactExistsAlreadyButtonText, contactExistsAlreadyByNameButtonText, contactExistsMessage, logInAddMeToYourContactsButtonText, userNotLoggedInErrorMessage
} from './texts'
import './styles/ProfileCard.css'
import ContactsModuleRdfLib from '@solid-data-modules/contacts-rdflib'
import { addErrorToErrorDisplay } from './ContactsCard'

let buttonContainer = <HTMLDivElement>document.createElement('section')

const addMeToYourContactsDiv = async (
  subject: NamedNode,
  context: DataBrowserContext
): Promise<TemplateResult> => {
  
  buttonContainer = context.dom.createElement('section') as HTMLDivElement
  buttonContainer.setAttribute('id', 'add-to-contacts-button-container')
  buttonContainer.setAttribute('class', 'buttonSubSection text-truncate text-center section-centered')
  buttonContainer.setAttribute('aria-labelledby', 'add-me-to-your-contacts-button-section')
  buttonContainer.setAttribute('data-testid', 'button')

  // Add a visually hidden heading for accessibility
  const heading = context.dom.createElement('h3')
  heading.setAttribute('id', 'add-me-to-your-contacts-button-section')
  heading.setAttribute('class', 'sr-only')
  heading.textContent = 'Add me to your contacts actions'
  buttonContainer.appendChild(heading)

  const button = await createAddMeToYourContactsButton(subject, context)
  button.classList.add('actionButton', 'btn-primary', 'action-button-focus')
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
  let label = checkIfAnyUserLoggedIn(me) ? addMeToYourContactsButtonText.toUpperCase() : logInAddMeToYourContactsButtonText.toUpperCase()
  const button = widgets.button(
    context.dom,
    undefined,
    label,
    setButtonHandler, //sets an onclick event listener
    {
      needsBorder: true,
    }
  )
  button.setAttribute('id', 'add-to-contacts-button')
  //button.refresh = refreshButton(context, subject, addressBooksData)
  button.refresh = refreshButton()
  
  function refreshButton() {
    if (checkIfAnyUserLoggedIn(me)) {
        const contactExistsByWebID = checkIfContactExistsByWebID(subject.value, addressBooksData)
        const contactExistsByName = checkIfContactExistsByName(addressBooksData, contactData.name)
        console.log("contact exists by name: " + contactExistsByName)
        if (contactExistsByWebID) {
          //logged in and friend exists or friend was just added
          button.innerHTML = contactExistsAlreadyButtonText.toUpperCase()
          button.onclick = null 
        } else if (contactExistsByName) {
          button.innerHTML = contactExistsAlreadyByNameButtonText.toUpperCase()
        }
          else {
          //logged in and friend does not exist yet
          button.innerHTML = addMeToYourContactsButtonText.toUpperCase()
        }
      } else {
        //not logged in
        button.innerHTML = logInAddMeToYourContactsButtonText.toUpperCase()
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
    if (!(checkIfContactExistsByWebID(subject.value, addressBooksData))) {
      //if contact does not exist, we add her/him
      await store.fetcher.load(me)
      try {
        const contactData: ContactData = await getContactData(store, subject) 
        const contactExistsByNameUri = checkIfContactExistsByName(addressBooksData, contactData.name)
        console.log("contactExistsByNameUri: " + contactExistsByNameUri)
        if (contactExistsByNameUri) {
          await addWebIDToExistingContact(context, contactsModule, addressBooksData, contactData.webID, contactExistsByNameUri)
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
