import { html, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { authn } from 'solid-logic'
import { LiveStore, NamedNode, st } from 'rdflib'
import { ns, widgets } from 'solid-ui'
import {
  clearPreviousMessage, complain,
  mention
} from './buttonsHelper'
import { getSelectedAddressBookUris, getContactData } from './contactsHelpers'
import {
  addMeToYourContactsButtonText, contactExistsMessage, contactWasAddedSuccesMessage, logInAddMeToYourContactsButtonText, userNotLoggedInErrorMessage
} from './texts'
import './styles/ProfileCard.css'
import ContactsModuleRdfLib, { NewContact } from '@solid-data-modules/contacts-rdflib'

let buttonContainer = <HTMLDivElement>document.createElement('section')

const addMeToYourContactsDiv = (
  subject: NamedNode,
  context: DataBrowserContext
): TemplateResult => {

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

  const button = createAddMeToYourContactsButton(subject, context)
  button.classList.add('actionButton', 'btn-primary', 'action-button-focus')
  buttonContainer.appendChild(button)
  return html`${buttonContainer}`
}

const createAddMeToYourContactsButton = (
  subject: NamedNode,
  context: DataBrowserContext
): HTMLButtonElement => {
  const me = authn.currentUser()
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

  function setButtonHandler(event) {
    event.preventDefault()
    saveNewContact(subject, context)
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
    // will need store if use check if Contact Exists
    // const store: LiveStore = context.session.store

    if (checkIfAnyUserLoggedIn(me)) {
      button.innerHTML = addMeToYourContactsButtonText.toUpperCase()
    } else {
      //not logged in
      button.innerHTML = logInAddMeToYourContactsButtonText.toUpperCase()
    }
  }
  return button
}

async function saveNewContact(
  subject: NamedNode,
  context: DataBrowserContext
): Promise<void> {
  const me = authn.currentUser()

  const store: LiveStore = context.session.store
  const fetcher = store.fetcher
  const updater = store.updater
  const contacts = new ContactsModuleRdfLib({ store, fetcher, updater})
// need to find out where the user wants to add the Contact
  if (checkIfAnyUserLoggedIn(me)) {
    if (!(await checkIfContactExists(store , me, subject))) {
      //if friend does not exist, we add her/him
      await store.fetcher.load(me)
      try {
        const uris = await getSelectedAddressBookUris(contacts, context, me.toString(), buttonContainer)
        // const contactData: NewContact = await getContactData(store, subject)
        
        console.log("uris: " + JSON.stringify(uris))
        // console.log("contact Data: " + JSON.stringify(contactData))
        
        // const contact = await contacts.createNewContact({addressBookUri: uris.addressBookUri, contact: { name: "Sally", email: "testing@gmail.com", phoneNumber: "5555-5555"}, groupUris: uris.groupUris}) 
        
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

async function checkIfContactExists(
  store: LiveStore,
  me: NamedNode,
  subject: NamedNode
): Promise<boolean> {
  await store.fetcher.load(me)
  return false // need to remove
  // need to search through and find the
  // logged in users AddressBook files
  // traverse through and look for subject
  if (store.whether(me, ns.foaf('knows'), subject, me.doc()) === 0)
    return false
  else return true
}

export {
  addMeToYourContactsDiv,
  createAddMeToYourContactsButton,
  saveNewContact,
  checkIfContactExists,
}
