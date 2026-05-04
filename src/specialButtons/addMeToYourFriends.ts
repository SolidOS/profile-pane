import { html, TemplateResult } from 'lit-html'
import 'solid-ui/components/actions/button'
import type { Button as SolidUIButtonElement } from 'solid-ui/components/actions/button'
import { DataBrowserContext } from 'pane-registry'
import { authn } from 'solid-logic'
import { LiveStore, NamedNode, st } from 'rdflib'
import { ns } from 'solid-ui'
import {
  clearPreviousMessage, complain,
  mention
} from '../buttonsHelper'
import {
  addMeToYourFriendsButtonText, friendExistsAlreadyButtonText, friendExistsMessage, friendWasAddedSuccesMessage, logInAddMeToYourFriendsButtonText, userNotLoggedInErrorMessage
} from '../texts'
import { ViewerMode } from '../types'
import '../styles/AddMeToYourFriends.css'

let buttonContainer = <HTMLDivElement>document.createElement('section')

function setAddToFriendsButtonLabel(button: SolidUIButtonElement, label: string): void {
  const labelWrapper = button.ownerDocument.createElement('span')
  labelWrapper.className = 'profile__btn-friends-label'
  labelWrapper.textContent = label
  button.replaceChildren(labelWrapper)
}

const addMeToYourFriendsDiv = (
  subject: NamedNode,
  context: DataBrowserContext,
  _viewerMode: ViewerMode
): TemplateResult => {

  buttonContainer = context.dom.createElement('section') as HTMLDivElement
  buttonContainer.setAttribute('class', 'profile-friends-button__section text-truncate text-center section-centered')
  buttonContainer.setAttribute('aria-labelledby', 'add-me-to-your-friends-button-section')
  buttonContainer.setAttribute('data-testid', 'button')

  // Add a visually hidden heading for accessibility
  const heading = context.dom.createElement('h3')
  heading.setAttribute('id', 'add-me-to-your-friends-button-section')
  heading.setAttribute('class', 'sr-only')
  heading.textContent = 'Add me to your friends actions'
  buttonContainer.appendChild(heading)

  const button = createAddMeToYourFriendsButton(subject, context)
  button.classList.add('profile__action-button', 'profile__btn-friends', 'flex-center')
  buttonContainer.appendChild(button)
  return html`${buttonContainer}`
}

const createAddMeToYourFriendsButton = (
  subject: NamedNode,
  context: DataBrowserContext
): SolidUIButtonElement => {
  let label = addMeToYourFriendsButtonText
  const button = context.dom.createElement('solid-ui-button') as SolidUIButtonElement
  button.setAttribute('type', 'button')
  button.setAttribute('variant', 'secondary')
  button.setAttribute('size', 'sm')
  setAddToFriendsButtonLabel(button, label)
  button.addEventListener('click', setButtonHandler)

  function setButtonHandler(event: Event) {
    event.preventDefault()
    saveNewThing(subject, context, ns.foaf('knows'))
      .then(() => {
        clearPreviousMessage(buttonContainer)
        mention(buttonContainer, friendWasAddedSuccesMessage)
        refreshButton()
      })
      .catch((error) => {
        clearPreviousMessage(buttonContainer)
        //else UI.widgets.complain(buttonContainer, message); //displays an error message at the top of the window
        complain(buttonContainer, context, error)
      })
  }

  refreshButton()

  function refreshButton() {
    const me = authn.currentUser()
    const store: LiveStore = context.session.store

    if (checkIfAnyUserLoggedIn(me)) {
      button.disabled = false
      checkIfThingExists(store, me, subject, ns.foaf('knows')).then((friendExists) => {
        if (friendExists) {
          //logged in and friend exists or friend was just added
          setAddToFriendsButtonLabel(button, friendExistsAlreadyButtonText)
        } else {
          //logged in and friend does not exist yet
          setAddToFriendsButtonLabel(button, addMeToYourFriendsButtonText)
        }
      })
    } else {
      //not logged in — disable and indicate login is required
      setAddToFriendsButtonLabel(button, logInAddMeToYourFriendsButtonText)
      button.disabled = true
    }
  }

  return button
}

async function saveNewThing(
  subject: NamedNode,
  context: DataBrowserContext,
  predicate: NamedNode
): Promise<void> {
  const me = authn.currentUser()
  const store: LiveStore = context.session.store

  if (checkIfAnyUserLoggedIn(me)) {
    if (!(await checkIfThingExists(store , me, subject, predicate))) {
      //if friend does not exist, we add her/him
      await store.fetcher.load(me)
      const updater = store.updater
      const toBeInserted = [st(me, predicate, subject, me.doc())]
      try {
        await updater.update([], toBeInserted)
      } catch (error) {
        let errorMessage = error
        if (errorMessage.toString().includes('Unauthenticated'))
          errorMessage = userNotLoggedInErrorMessage
        throw new Error(errorMessage)
      }
    } else throw new Error(friendExistsMessage)
  } else throw new Error(userNotLoggedInErrorMessage)
}

function checkIfAnyUserLoggedIn(me: NamedNode): boolean {
  if (me) return true
  else return false
}

async function checkIfThingExists(
  store: LiveStore,
  me: NamedNode,
  subject: NamedNode,
  predicate: NamedNode
): Promise<boolean> {
  await store.fetcher.load(me)
  if (store.whether(me, predicate, subject, me.doc()) === 0)
    return false
  else return true
}

export {
  addMeToYourFriendsDiv,
  createAddMeToYourFriendsButton,
  saveNewThing,
  checkIfThingExists
}
