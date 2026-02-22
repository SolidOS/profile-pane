import { html, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { authn } from 'solid-logic'
import { LiveStore, NamedNode } from 'rdflib'
import { widgets } from 'solid-ui'
import {
  clearPreviousMessage, complain,
  mention
} from './buttonsHelper'
import { getContactData, getAddressBooksData, addContactToAddressBook } from './contactsHelpers'
import { AddressBooksData, ContactData } from './contactsTypes'
import {
  addMeToYourContactsButtonText, contactExistsAlreadyButtonText, contactExistsMessage, contactWasAddedSuccesMessage, logInAddMeToYourContactsButtonText, userNotLoggedInErrorMessage
} from './texts'
import './styles/ProfileCard.css'
import ContactsModuleRdfLib from '@solid-data-modules/contacts-rdflib'

let buttonContainer = <HTMLDivElement>document.createElement('section')

const addMeToYourContactsDiv = async (
  subject: NamedNode,
  context: DataBrowserContext
): Promise<TemplateResult> => {
  
  buttonContainer = context.dom.createElement('section') as HTMLDivElement
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
  const store: LiveStore = context.session.store
  const fetcher = store.fetcher
  const updater = store.updater
  const contactsModule = new ContactsModuleRdfLib({ store, fetcher, updater})

  try {
    addressBooksData = await getAddressBooksData(context, contactsModule)
  } catch (error) {
    throw new Error(error)
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

  function setButtonHandler(event) {
    event.preventDefault()
    saveNewContact(subject, context, contactsModule, addressBooksData)
      .then(() => {
        // clearPreviousMessage(buttonContainer)
        mention(buttonContainer, contactWasAddedSuccesMessage)
        refreshButton()
      })
      .catch((error) => {
        clearPreviousMessage(buttonContainer)
        //else UI.widgets.complain(buttonContainer, message); //displays an error message at the top of the window
        complain(buttonContainer, context, error)
      })
  }

  button.refresh = refreshButton()

  function refreshButton() {
    const me = authn.currentUser()
  
    if (checkIfAnyUserLoggedIn(me)) {
      const contactExists = checkIfContactExists(subject, addressBooksData)
      if (contactExists) {
        //logged in and friend exists or friend was just added
        button.innerHTML = contactExistsAlreadyButtonText.toUpperCase()
        button.onclick = null 
      } else {
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
    if (!(checkIfContactExists(subject, addressBooksData))) {
      //if contact does not exist, we add her/him
      await store.fetcher.load(me)
      try {
        const contactData: ContactData = await getContactData(store, subject)
        await addContactToAddressBook(context, contactsModule, contactData, addressBooksData, buttonContainer)
        
      } catch (error) {
        let errorMessage = error
        if (errorMessage.toString().includes('Unauthenticated'))
          errorMessage = userNotLoggedInErrorMessage
        throw new Error(errorMessage)
      }
    } else throw new Error(contactExistsMessage)
  } else throw new Error(userNotLoggedInErrorMessage)
}

// move this to a helper file
function checkIfAnyUserLoggedIn(me: NamedNode): boolean {
  if (me) return true
  else return false
}

function checkIfContactExists(
  subject: NamedNode,
  addressBooksData: AddressBooksData
): boolean {
 if (addressBooksData.contacts.has(subject.value)) return true
  return false
}

export {
  addMeToYourContactsDiv,
  createAddMeToYourContactsButton,
  saveNewContact,
  checkIfContactExists,
}
