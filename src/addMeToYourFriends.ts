import { html, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { authn } from 'solid-logic'
import { LiveStore, NamedNode, st } from 'rdflib'
import { ns, widgets } from 'solid-ui'
import {
  clearPreviousMessage, complain,
  mention
} from './buttonsHelper'
import {
  addMeToYourFriendsButtonText, friendExistsAlreadyButtonText, friendExistsMessage, friendWasAddedSuccesMessage, logInAddMeToYourFriendsButtonText, userNotLoggedInErrorMessage
} from './texts'
import { ViewerMode } from './types'
import './styles/ProfileCard.css'

let buttonContainer = <HTMLDivElement>document.createElement('section')

const addMeToYourFriendsDiv = (
  subject: NamedNode,
  context: DataBrowserContext,
  viewerMode: ViewerMode
): TemplateResult => {

  buttonContainer = context.dom.createElement('section') as HTMLDivElement
  buttonContainer.setAttribute('class', 'buttonSubSection text-truncate text-center section-centered')
  buttonContainer.setAttribute('aria-labelledby', 'add-me-to-your-friends-button-section')
  buttonContainer.setAttribute('data-testid', 'button')

  // Add a visually hidden heading for accessibility
  const heading = context.dom.createElement('h3')
  heading.setAttribute('id', 'add-me-to-your-friends-button-section')
  heading.setAttribute('class', 'sr-only')
  heading.textContent = 'Add me to your friends actions'
  buttonContainer.appendChild(heading)

  const button = createAddMeToYourFriendsButton(subject, context)
  button.classList.add('actionButton', 'btn-primary', 'action-button-focus')
  buttonContainer.appendChild(button)
  return html`${buttonContainer}`
}

const createAddMeToYourFriendsButton = (
  subject: NamedNode,
  context: DataBrowserContext
): HTMLButtonElement => {
  const me = authn.currentUser()
  let label = checkIfAnyUserLoggedIn(me) ? addMeToYourFriendsButtonText.toUpperCase() : logInAddMeToYourFriendsButtonText.toUpperCase()
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

  button.refresh = refreshButton()

  function refreshButton() {
    const me = authn.currentUser()
    const store: LiveStore = context.session.store

    if (checkIfAnyUserLoggedIn(me)) {
      checkIfThingExists(store, me, subject, ns.foaf('knows')).then((friendExists) => {
        if (friendExists) {
          //logged in and friend exists or friend was just added
          button.innerHTML = friendExistsAlreadyButtonText.toUpperCase()
        } else {
          //logged in and friend does not exist yet
          button.innerHTML = addMeToYourFriendsButtonText.toUpperCase()
        }
      })
    } else {
      //not logged in
      button.innerHTML = logInAddMeToYourFriendsButtonText.toUpperCase()
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

function extractFriends(editable: boolean, subject: NamedNode, { dom }: DataBrowserContext): HTMLDivElement | null {
  const target = dom.createElement('div')
  console.log('Extracting friends for subject:', subject.doc()) // Debug log to check the subject
  widgets.attachmentList(dom, subject, target, {
    doc: subject.doc(),
    modify: editable,
    predicate: ns.foaf('knows'),
    noun: 'friend',
  })
  if (target.textContent === '')
    return null
  console.log('Extracted friends:', target.innerHTML) // Debug log to check the generated HTML
  return target
}

export {
  addMeToYourFriendsDiv,
  createAddMeToYourFriendsButton,
  saveNewThing,
  extractFriends,
  checkIfThingExists
}
