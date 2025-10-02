import { html, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { authn } from 'solid-logic'
import { LiveStore } from 'rdflib'
import { ns, rdf, widgets, style } from 'solid-ui'
import {
  clearPreviousMessage, complain,
  mention
} from './buttonsHelper'
import {
  addMeToYourFriendsButtonText, friendExistsAlreadyButtonText, friendExistsMessage, friendWasAddedSuccesMessage, logInAddMeToYourFriendsButtonText, userNotLoggedInErrorMessage
} from './texts'

let buttonContainer = <HTMLDivElement>document.createElement('div')

const addMeToYourFriendsDiv = (
  subject: rdf.NamedNode,
  context: DataBrowserContext
): TemplateResult => {
  buttonContainer = context.dom.createElement('div')
  const button = createAddMeToYourFriendsButton(subject, context)
  buttonContainer.appendChild(button)
  return html`<div class="center">${buttonContainer}</div>`
}

const createAddMeToYourFriendsButton = (
  subject: rdf.NamedNode,
  context: DataBrowserContext
): HTMLButtonElement => {
  const button = widgets.button(
    context.dom,
    undefined,
    logInAddMeToYourFriendsButtonText,
    setButtonHandler, //sets an onclick event listener
    {
      needsBorder: true,
    }
  )

  function setButtonHandler(event) {
    event.preventDefault()
    saveNewFriend(subject, context)
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
      checkIfFriendExists(store , me, subject).then((friendExists) => {
        if (friendExists) {
          //logged in and friend exists or friend was just added
          button.innerHTML = friendExistsAlreadyButtonText.toUpperCase()
          button.className = 'button'
          button.setAttribute('class', style.primaryButton)
        } else {
          //logged in and friend does not exist yet
          button.innerHTML = addMeToYourFriendsButtonText.toUpperCase()
          button.className = 'button'
          button.setAttribute('class', style.primaryButtonNoBorder)
        }
      })
    } else {
      //not logged in
    button.innerHTML = logInAddMeToYourFriendsButtonText.toUpperCase()
    button.className = 'button'
    button.setAttribute('class', style.primaryButton)
    }
  }

  return button
}

async function saveNewFriend(
  subject: rdf.NamedNode,
  context: DataBrowserContext
): Promise<void> {
  const me = authn.currentUser()
  const store: LiveStore = context.session.store

  if (checkIfAnyUserLoggedIn(me)) {
    if (!(await checkIfFriendExists(store , me, subject))) {
      //if friend does not exist, we add her/him
      await store.fetcher.load(me)
      const updater = store.updater
      const toBeInserted = [rdf.st(me, ns.foaf('knows'), subject, me.doc())]
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

function checkIfAnyUserLoggedIn(me: rdf.NamedNode): boolean {
  if (me) return true
  else return false
}

async function checkIfFriendExists(
  store: LiveStore,
  me: rdf.NamedNode,
  subject: rdf.NamedNode
): Promise<boolean> {
  await store.fetcher.load(me)
  if (store.whether(me, ns.foaf('knows'), subject, me.doc()) === 0)
    return false
  else return true
}

export {
  addMeToYourFriendsDiv,
  createAddMeToYourFriendsButton,
  saveNewFriend,
  checkIfAnyUserLoggedIn,
  checkIfFriendExists,
}
